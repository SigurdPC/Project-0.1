import { useState } from 'react';
import { Container, Typography } from '@mui/material';
import DataTable, { Column } from '../components/DataTable';
import { DPHours } from '../types';

const columns: Column[] = [
  { id: 'date', label: 'Date', type: 'date' },
  { id: 'location', label: 'Location' },
  { id: 'time', label: 'Time', type: 'time' },
  { id: 'event', label: 'Event' },
];

const DPHoursPage = () => {
  const [data, setData] = useState<DPHours[]>([]);

  const handleAdd = (newData: DPHours) => {
    setData([...data, newData]);
  };

  const handleEdit = (id: string, updatedData: DPHours) => {
    setData(data.map((item) => (item.id === id ? updatedData : item)));
  };

  const handleDelete = (id: string) => {
    setData(data.filter((item) => item.id !== id));
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        DP Hours
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

export default DPHoursPage; 