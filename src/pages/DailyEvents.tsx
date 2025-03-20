import { Container, Typography } from '@mui/material';
import DataTable, { Column } from '../components/DataTable';
import { DailyEvent, OperationType } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import { useState } from 'react';

const columns: Column[] = [
  { id: 'date', label: 'Date', type: 'date' },
  { id: 'startTime', label: 'Start Time', type: 'time' },
  { id: 'endTime', label: 'End Time', type: 'time' },
  { id: 'origin', label: 'Origin' },
  { id: 'destination', label: 'Destination' },
  { 
    id: 'operationType', 
    label: 'Operation Type', 
    type: 'select',
    options: ['In Port', 'In Transit', 'DP Operation', 'Standby'] as OperationType[]
  },
  { id: 'consumptionME', label: 'Consumption M/E', type: 'number' },
  { id: 'consumptionAE', label: 'Consumption A/E', type: 'number' },
];

const DailyEvents = () => {
  const [data, setData] = useState<DailyEvent[]>([]);

  const handleAdd = (newData: DailyEvent) => {
    setData([...data, newData]);
  };

  const handleEdit = (id: string, updatedData: DailyEvent) => {
    setData(data.map((item: DailyEvent) => (item.id === id ? updatedData : item)));
  };

  const handleDelete = (id: string) => {
    setData(data.filter((item: DailyEvent) => item.id !== id));
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Daily Events
      </Typography>
      <DataTable
        columns={columns}
        data={data}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </Container>
  );
};

export default DailyEvents; 