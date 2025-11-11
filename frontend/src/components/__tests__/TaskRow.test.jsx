import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ToastProvider } from '../../context/ToastContext';

// Mock the projectsAPI used by TaskRow (module path relative to this test file)
vi.mock('../../services/api', () => ({
  projectsAPI: {
    updateTask: vi.fn()
  }
}));

import { projectsAPI } from '../../services/api';
import { TaskRow } from '../ProjectDetail';

function renderWithProviders(ui) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe('TaskRow', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  afterEach(() => {
    cleanup();
  });

  it('calls API and notifies parent on successful save', async () => {
    const mockTask = {
      id: 42,
      name: 'Tarea ejemplo',
      responsible: 'Alice',
      weight: 1,
      planned_progress: 50,
      actual_progress: 40,
      delay_days: 0,
      status: 'En Curso',
      estimated_date: null,
      comments: ''
    };

    projectsAPI.updateTask.mockResolvedValue({ data: { ...mockTask, actual_progress: 45 } });

    const onSaved = vi.fn();

    renderWithProviders(<table><tbody><TaskRow task={mockTask} canEdit={true} projectId={1} onSaved={onSaved} /></tbody></table>);

    // Enter edit mode
    const editBtn = screen.getByLabelText('Editar tarea');
    fireEvent.click(editBtn);

  // Change progress (choose the first numeric input which is the actual progress)
  const inputs = screen.getAllByRole('spinbutton');
  const input = inputs[0];
  fireEvent.change(input, { target: { value: '45' } });

    // Save
    const saveBtn = screen.getByLabelText('Guardar tarea');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(projectsAPI.updateTask).toHaveBeenCalledWith(1, 42, expect.objectContaining({ actualProgress: 45 }));
      expect(onSaved).toHaveBeenCalled();
    });

    // Toast should be shown
    await screen.findByText(/Tarea actualizada correctamente/);
  });

  it('shows error toast when API fails', async () => {
    const mockTask = {
      id: 43,
      name: 'Tarea fallida',
      responsible: 'Bob',
      weight: 1,
      planned_progress: 80,
      actual_progress: 60,
      delay_days: 0,
      status: 'En Curso',
      estimated_date: null,
      comments: ''
    };

    projectsAPI.updateTask.mockRejectedValue({ message: 'Server error' });

    const onSaved = vi.fn();

    renderWithProviders(<table><tbody><TaskRow task={mockTask} canEdit={true} projectId={2} onSaved={onSaved} /></tbody></table>);

  fireEvent.click(screen.getByLabelText('Editar tarea'));
  const inputs = screen.getAllByRole('spinbutton');
  const input = inputs[0];
  fireEvent.change(input, { target: { value: '65' } });
    fireEvent.click(screen.getByLabelText('Guardar tarea'));

    await waitFor(() => {
      expect(projectsAPI.updateTask).toHaveBeenCalled();
      expect(onSaved).not.toHaveBeenCalled();
    });

    await screen.findByText(/Server error/);
  });
});
