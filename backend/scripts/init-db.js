import { initDatabase, closeDatabase } from '../database.js';
import { User } from '../models/User.js';
import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';
import { WeeklySnapshot } from '../models/WeeklySnapshot.js';
import { logger } from '../utils/logger.js';

const FORCE = process.argv.includes('--force');

if (process.env.NODE_ENV === 'production' && !FORCE) {
  logger.error('Refusing to run init-db in production without --force');
  process.exit(1);
}

async function seedDatabase() {
  try {
    await initDatabase();
    logger.info('Database initialized');

    // Create default users
    const users = [
      { username: 'ceo', password: 'ceo123', role: 'CEO', canEdit: false, canView: 'all' },
      { username: 'cto', password: 'cto123', role: 'CTO', canEdit: false, canView: 'all' },
      { username: 'admin', password: 'admin123', role: 'Admin', canEdit: true, canView: 'all' },
      { username: 'pm1', password: 'pm123', role: 'PM', canEdit: true, canView: 'assigned' },
      { username: 'pm2', password: 'pm123', role: 'PM', canEdit: true, canView: 'assigned' }
    ];

  logger.info('Creating users...');
    for (const userData of users) {
      try {
  await User.create(userData);
  logger.info(`User created: ${userData.username}`);
      } catch (error) {
        if (String(error).includes('UNIQUE constraint')) {
          logger.info(`User already exists: ${userData.username}`);
        } else {
          throw error;
        }
      }
    }

    // Create projects
    const projectsData = [
      { name: 'Cámaras de Vigilancia', category: 'Infraestructura', description: 'Instalación de sistema de cámaras de seguridad' },
      { name: 'Planta de Emergencia', category: 'Infraestructura', description: 'Implementación de planta de energía de emergencia' },
      { name: 'Red WiFi', category: 'Conectividad', description: 'Despliegue de red WiFi corporativa' },
      { name: 'Migración Protactic Technology', category: 'Migración', description: 'Migración de sistemas a Protactic Technology' },
      { name: 'Estandarización y Auditoría', category: 'Auditoría', description: 'Proceso de estandarización y auditoría de procesos' },
      { name: 'Comité de Información', category: 'Gobernanza', description: 'Establecimiento del comité de información' }
    ];

  logger.info('Creating projects...');
    const createdProjects = [];
    for (const projectData of projectsData) {
      try {
  const project = await Project.create(projectData);
  createdProjects.push(project);
  logger.info(`Project created: ${project.name}`);
      } catch (error) {
  logger.error(`Error creating project ${projectData.name}`, { error });
      }
    }

    // Assign projects to PMs
    const pm1 = await User.findByUsername('pm1');
    const pm2 = await User.findByUsername('pm2');
    
      if (pm1 && createdProjects.length >= 3) {
      await User.assignProject(pm1.id, createdProjects[0].id); // Cámaras
      await User.assignProject(pm1.id, createdProjects[1].id); // Planta
      await User.assignProject(pm1.id, createdProjects[2].id); // WiFi
      logger.info('Assigned first 3 projects to pm1');
    }

    if (pm2 && createdProjects.length >= 6) {
      await User.assignProject(pm2.id, createdProjects[3].id); // Migración
      await User.assignProject(pm2.id, createdProjects[4].id); // Auditoría
      await User.assignProject(pm2.id, createdProjects[5].id); // Comité
      logger.info('Assigned last 3 projects to pm2');
    }

    // Create sample tasks for first project
    if (createdProjects.length > 0) {
      const firstProject = createdProjects[0];
      const tasks = [
        {
          name: 'Análisis de requerimientos',
          responsible: 'Equipo de Infraestructura',
          weight: 1.0,
          plannedProgress: 100,
          actualProgress: 100,
          estimatedDate: '2024-01-15'
        },
        {
          name: 'Adquisición de equipos',
          responsible: 'Compras',
          weight: 1.5,
          plannedProgress: 80,
          actualProgress: 75,
          estimatedDate: '2024-02-20'
        },
        {
          name: 'Instalación física',
          responsible: 'Equipo de Infraestructura',
          weight: 2.0,
          plannedProgress: 50,
          actualProgress: 40,
          estimatedDate: '2024-03-15'
        },
        {
          name: 'Configuración y pruebas',
          responsible: 'IT',
          weight: 1.5,
          plannedProgress: 30,
          actualProgress: 20,
          estimatedDate: '2024-04-01'
        }
      ];

  logger.info('Creating sample tasks...');
      for (const taskData of tasks) {
        try {
          await Task.create({
            projectId: firstProject.id,
            ...taskData
          });
        } catch (error) {
          logger.error('Error creating task', { error });
        }
      }
    }

    // Create sample weekly snapshots for the first project's tasks
    if (createdProjects.length > 0) {
      logger.info('Creating sample weekly snapshots...');
      const firstProject = createdProjects[0];
      const tasks = await Task.findByProject(firstProject.id);

      // Generate snapshots for current and previous month
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

      // Sample snapshot data
      const WEEKS = [1, 2, 3, 4];
      for (const task of tasks) {
        // Previous month snapshots
        for (const week of WEEKS) {
          const baseProgress = (week * 25); // 25%, 50%, 75%, 100% progression
          await WeeklySnapshot.upsert({
            taskId: task.id,
            projectId: firstProject.id,
            year: previousYear,
            month: previousMonth,
            weekNumber: week,
            plannedStatus: 'P',
            actualStatus: week < 4 ? 'R' : 'RP',
            plannedProgress: baseProgress,
            actualProgress: Math.max(0, baseProgress - (week === 4 ? 15 : 5)), // Slight delay in last week
            comments: week === 4 ? 'Retraso por problemas de entrega' : null
          });
        }

        // Current month snapshots
        for (const week of WEEKS) {
          if (week > Math.floor((now.getDate() - 1) / 7) + 1) continue; // Only create up to current week
          
          const baseProgress = 85 + (week * 5); // Starting from 85% (previous month) going to 100%
          await WeeklySnapshot.upsert({
            taskId: task.id,
            projectId: firstProject.id,
            year: currentYear,
            month: currentMonth,
            weekNumber: week,
            plannedStatus: 'P',
            actualStatus: 'R',
            plannedProgress: baseProgress,
            actualProgress: baseProgress - 3, // Slight ongoing delay
            comments: week === 1 ? 'Recuperando retraso del mes anterior' : null
          });
        }
      }
      logger.info('Created sample weekly snapshots');
    }

    logger.info('Database seeded successfully!');
    await closeDatabase();
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding database:', { error });
    try {
      await closeDatabase();
    } catch (e) {
      logger.error('Error closing database after seed failure', { e });
    }
    process.exit(1);
  }
}



seedDatabase();

