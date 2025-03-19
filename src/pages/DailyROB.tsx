import { useState } from 'react';
import { Container, Typography } from '@mui/material';
import DataTable, { Column } from '../components/DataTable';
import type { DailyROB as DailyROBType } from '../types';

const columns: Column[] = [
  { id: 'date', label: 'Date', type: 'date' },
  { id: 'startTime', label: 'Start Time', type: 'time' },
  { id: 'endTime', label: 'End Time', type: 'time' },
  { id: 'origin', label: 'Origin' },
  { id: 'destination', label: 'Destination' },
  { id: 'operationType', label: 'Operation Type' },
  { id: 'consumptionME', label: 'Consumption M/E', type: 'number' },
  { id: 'consumptionAE', label: 'Consumption A/E', type: 'number' },
];

const DailyROB = () => {
  const [data, setData] = useState<DailyROBType[]>([]);

  const handleAdd = (newData: DailyROBType) => {
    setData([...data, newData]);
  };

  const handleEdit = (id: string, updatedData: DailyROBType) => {
    setData(data.map((item) => (item.id === id ? updatedData : item)));
  };

  const handleDelete = (id: string) => {
    setData(data.filter((item) => item.id !== id));
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Daily ROB
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

export default DailyROB; 