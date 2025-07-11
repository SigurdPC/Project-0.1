import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  Chip,
  IconButton,
  Grid,
  Tooltip,
  CircularProgress,
  Alert,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  AttachFile as AttachFileIcon,
  Description as DescriptionIcon,
  Business as BusinessIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Comment as CommentIcon
} from '@mui/icons-material';
import { VesselCertificate } from '../types';
import { vesselCertificatesApi } from '../api/vesselCertificatesApi';
import { certificateFilesApi } from '../api/certificateFilesApi';
import AppDatePicker from '../components/common/AppDatePicker';

// List of certificates from the provided file
const CERTIFICATE_OPTIONS = [
  'International Tonnage Certificate (1969)',
  'International Load Line Certificate',
  'International Load Line Exemption Certificate',
  'Coating Technical File',
  'Damage control plans and booklets',
  'Minimum safe manning document',
  'Fire safety training manual',
  'Fire control plan/booklet',
  'Onboard training and drills record',
  'Fire safety operational booklet',
  'Training manual',
  'Nautical charts and nautical publications',
  'International Code of Signals and a copy of Volume III of IAMSAR Manual',
  'Records of navigational activities',
  'Manoeuvring booklet',
  'Material Safety Data Sheets (MSDS)',
  'AIS test report',
  'LRIT conformance test report',
  'Certificates for masters, officers or ratings',
  'Records of hours of rest',
  'International Oil Pollution Prevention Certificate',
  'Oil Record Book',
  'Shipboard Oil Pollution Emergency Plan',
  'International Sewage Pollution Prevention Certificate',
  'Garbage Management Plan',
  'Garbage Record Book',
  'Voyage data recorder system - certificate of compliance',
  'Cargo Securing Manual',
  'Document of Compliance',
  'Safety Management Certificate',
  'International Ship Security Certificate (ISSC) or Interim International Ship Security Certificate',
  'Ship Security Plan and associated records',
  'Continuous Synopsis Record (CSR)',
  'International Anti-fouling System Certificate',
  'Manufacturer\'s Operating Manual for Incinerators',
  'Bunker Delivery Note and Representative Sample',
  'Ship Energy Efficiency Management Plan (SEEMP)',
  'EEDI Technical File',
  'Technical File',
  'Record Book of Engine Parameters',
  'Exemption Certificate',
  'Noise Survey Report',
  'Ship-specific Plans and Procedures for Recovery of Persons from the Water',
  'Cargo Ship Safety Certificate',
  'Document of authorization for the carriage of grain',
  'Certificate of insurance or other financial security in respect of civil liability for oil pollution damage',
  'Certificate of insurance or other financial security in respect of civil liability for bunker oil pollution damage',
  'Enhanced survey report file',
  'Record of oil discharge monitoring and control system for the last ballast Voyage',
  'Oil Discharge Monitoring and Control (ODMC) Operational Manual',
  'Cargo Information',
  'Ship Structure Access Manual',
  'Bulk Carrier Booklet',
  'Crude Oil Washing Operation and Equipment Manual (COW)',
  'Condition Assessment Scheme (CAS) Statement of Compliance, CAS Final Report and Review Record',
  'Subdivision and stability information',
  'VOC Management Plan',
  'International Pollution Prevention Certificate for the Carriage of Noxious Liquid Substances in Bulk (NLS Certificate)',
  'Cargo record book',
  'Procedures and Arrangements Manual (P & A Manual)',
  'Shipboard Marine Pollution Emergency Plan for Noxious Liquid Substances',
  'Certificate of Fitness for the Carriage of Dangerous Chemicals in Bulk',
  'International Certificate of Fitness for the Carriage of Dangerous Chemicals in Bulk',
  'International Certificate of Fitness for the Carriage of Liquefied Gases in Bulk',
  'A Nuclear Cargo Ship Safety Certificate or Nuclear Passenger Ship Safety Certificate',
  'Maintenance plans',
  'Maritime Labour Certificate (MLC)',
  'Declaration of Maritime Labour Compliance Part I (DMLC I)',
  'Declaration of Maritime Labour Compliance Part II (DMLC II)',
  'Certificate of Compliance for ILO 92',
  'Certificate of Compliance for ILO 133',
  'Medical Certificate for ILO 73',
  'Load Test Certificate for ILO 152',
  'Register Book for ILO 152',
  'Special Purpose Ship Safety Certificate',
  'Offshore Supply Vessel Document of Compliance',
  'Certificate of Fitness for Offshore Support Vessels',
  'Diving System Safety Certificate',
  'Dynamically Supported Craft Construction and Equipment Certificate',
  'Mobile Offshore Drilling Unit Safety Certificate'
];

const VesselCertificates: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [certificates, setCertificates] = useState<VesselCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<VesselCertificate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [certificateToDelete, setCertificateToDelete] = useState<VesselCertificate | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [hasNoExpiration, setHasNoExpiration] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    issuedBy: '',
    issueDate: '',
    expirationDate: '',
    comments: ''
  });

  // Load certificates on component mount
  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await vesselCertificatesApi.getAll();
      setCertificates(data);
    } catch (err) {
      setError('Failed to load certificates');
      console.error('Error loading certificates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setDialogOpen(true);
    setFormData({
      name: '',
      issuedBy: '',
      issueDate: '',
      expirationDate: '',
      comments: ''
    });
    setSelectedFile(null);
    setHasNoExpiration(false);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormData({
      name: '',
      issuedBy: '',
      issueDate: '',
      expirationDate: '',
      comments: ''
    });
    setSelectedFile(null);
    setHasNoExpiration(false);
    setIsEditing(false);
    setSelectedCertificate(null);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleFileAreaClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = (event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileOpen = async (certificate: VesselCertificate) => {
    if (!certificate.fileName) return;

    try {
      // Generate proper download filename based on certificate name and expiration date
      const suggestedName = generateDownloadFileName(certificate);
      await certificateFilesApi.downloadFile(certificate.fileName, suggestedName);
    } catch (error) {
      setError('Failed to download file');
      console.error('Error downloading file:', error);
    }
  };

  // Generate download filename based on certificate name and expiration date
  const generateDownloadFileName = (certificate: VesselCertificate): string => {
    // Use the same logic as generateFileName for consistency
    const generatedName = generateFileName(certificate.name, certificate.expirationDate, certificate.fileName);
    
    // If generateFileName didn't work, fallback to manual generation
    if (!generatedName) {
      const extension = certificate.fileName?.split('.').pop() || 'pdf';
      const cleanName = certificate.name
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 50);
      
      const dateString = certificate.expirationDate 
        ? `${new Date(certificate.expirationDate).getDate().toString().padStart(2, '0')}-${(new Date(certificate.expirationDate).getMonth() + 1).toString().padStart(2, '0')}-${new Date(certificate.expirationDate).getFullYear()}`
        : 'Permanent';
      
      return `${cleanName}_${dateString}.${extension}`;
    }
    
    return generatedName;
  };

  const handleCertificateClick = (certificate: VesselCertificate) => {
    setSelectedCertificate(certificate);
    setDetailsDialogOpen(true);
  };

  const handleDetailsClose = () => {
    setDetailsDialogOpen(false);
    setSelectedCertificate(null);
    setIsEditing(false);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEditClick = () => {
    if (selectedCertificate) {
      setFormData({
        name: selectedCertificate.name,
        issuedBy: selectedCertificate.issuedBy,
        issueDate: selectedCertificate.issueDate,
        expirationDate: selectedCertificate.expirationDate || '',
        comments: selectedCertificate.comments || ''
      });
      setHasNoExpiration(!selectedCertificate.expirationDate);
      setIsEditing(true);
      setDetailsDialogOpen(false);
      setDialogOpen(true);
    }
  };

  const handleDeleteClick = (certificate: VesselCertificate) => {
    setCertificateToDelete(certificate);
    setDeleteConfirmText('');
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setCertificateToDelete(null);
    setDeleteConfirmText('');
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmText === 'Delete' && certificateToDelete) {
      try {
        // Delete the associated file first (if exists)
        if (certificateToDelete.fileName) {
          try {
            await certificateFilesApi.deleteFile(certificateToDelete.fileName);
          } catch (err) {
            console.warn('Failed to delete associated file:', err);
          }
        }
        
        await vesselCertificatesApi.delete(certificateToDelete.id);
        await loadCertificates(); // Reload to get updated data
        handleDeleteCancel();
      } catch (err) {
        setError('Failed to delete certificate');
        console.error('Error deleting certificate:', err);
      }
    }
  };

  // Generate safe filename based on certificate name and expiration date
  const generateFileName = (certificateName: string, expirationDate: string | null, originalFileName?: string) => {
    if (!originalFileName) return undefined;
    
    // Get file extension
    const extension = originalFileName.split('.').pop();
    
    // Clean certificate name - remove special characters and limit length
    const cleanName = certificateName
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .replace(/^_|_$/g, '') // Remove leading/trailing underscores
      .substring(0, 50) // Limit to 50 characters
      .trim(); // Remove any whitespace
    
    // Ensure we have a valid name
    if (!cleanName) {
      return `Certificate_${Date.now()}.${extension}`;
    }
    
    // Format expiration date or use "Permanent" for no expiration
    let dateString = 'Permanent';
    if (expirationDate && expirationDate !== '9999-12-31') {
      const expDate = new Date(expirationDate);
      dateString = `${expDate.getDate().toString().padStart(2, '0')}-${(expDate.getMonth() + 1).toString().padStart(2, '0')}-${expDate.getFullYear()}`;
    }
    
    return `${cleanName}_${dateString}.${extension}`;
  };

  const handleSave = async () => {
    if (formData.name && formData.issuedBy && formData.issueDate && (hasNoExpiration || formData.expirationDate)) {
      try {
        let uploadedFileName: string | undefined;
        let uploadedFilePath: string | undefined;

        // Upload file if one is selected
        if (selectedFile) {
          const expirationDateForFilename = hasNoExpiration ? null : formData.expirationDate;
          const customFileName = generateFileName(formData.name, expirationDateForFilename, selectedFile.name);
          
          // Use the full custom filename (including extension) without splitting
          const fileBaseName = customFileName?.replace(/\.[^/.]+$/, ''); // Remove extension more safely
          
          try {
            const uploadResponse = await certificateFilesApi.uploadFile(selectedFile, fileBaseName);
            uploadedFileName = uploadResponse.filename;
            uploadedFilePath = certificateFilesApi.getDownloadUrl(uploadedFileName);
            console.log('File uploaded successfully:', { customFileName, uploadedFileName, uploadedFilePath });
          } catch (uploadError) {
            console.error('File upload failed:', uploadError);
            setError('Failed to upload file. Please try again.');
            return; // Don't save certificate if file upload fails
          }
        }

        // Prepare certificate data
        const certificateData = {
          name: formData.name,
          issuedBy: formData.issuedBy,
          issueDate: formData.issueDate,
          expirationDate: hasNoExpiration ? null : formData.expirationDate,
          comments: formData.comments, // Add comments to the data
          // Only include file info if file was successfully uploaded or we're editing an existing certificate
          fileName: uploadedFileName || (isEditing && selectedCertificate && !selectedFile ? selectedCertificate.fileName : undefined),
          filePath: uploadedFilePath || (isEditing && selectedCertificate && !selectedFile ? selectedCertificate.filePath : undefined)
        };

        // Ensure we don't save invalid file paths
        if (certificateData.filePath && certificateData.filePath.startsWith('blob:')) {
          certificateData.fileName = undefined;
          certificateData.filePath = undefined;
        }

        if (isEditing && selectedCertificate) {
          // Delete old file if a new one was uploaded
          if (uploadedFileName && selectedCertificate.fileName && selectedCertificate.fileName !== uploadedFileName) {
            try {
              await certificateFilesApi.deleteFile(selectedCertificate.fileName);
            } catch (err) {
              console.warn('Failed to delete old file:', err);
            }
          }
          // Update existing certificate
          await vesselCertificatesApi.update(selectedCertificate.id, certificateData);
        } else {
          // Create new certificate
          await vesselCertificatesApi.create(certificateData);
        }
        
        await loadCertificates(); // Reload to get updated data
        handleCloseDialog();
      } catch (err) {
        setError(isEditing ? 'Failed to update certificate' : 'Failed to save certificate');
        console.error('Error saving certificate:', err);
      }
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No expiration';
    return new Date(dateString).toLocaleDateString();
  };

  const isExpired = (expirationDate: string | null) => {
    if (!expirationDate) return false; // Permanent certificates never expire
    return new Date(expirationDate) < new Date();
  };

  const isExpiringSoon = (expirationDate: string | null) => {
    if (!expirationDate) return false; // Permanent certificates never expire
    const expDate = new Date(expirationDate);
    const today = new Date();
    const threeMonthsFromNow = new Date(today.getTime() + (90 * 24 * 60 * 60 * 1000)); // 3 months = ~90 days
    return expDate > today && expDate <= threeMonthsFromNow;
  };

  const isPermanent = (expirationDate: string | null) => {
    return !expirationDate;
  };

  return (
    <Container sx={{ mt: 4, mb: 6 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Button
          onClick={() => navigate('/')}
          startIcon={<ArrowBackIcon />}
          variant="contained"
          sx={{ 
            borderRadius: '4px',
            textTransform: 'uppercase',
            fontWeight: 500,
            py: 1,
            px: 2
          }}
        >
          Home
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 500, flexGrow: 1, textAlign: 'center' }}>
          Vessel Certificates
        </Typography>
        <Box sx={{ width: '120px' }} /> {/* Spacer to center the title */}
      </Box>

      <Paper sx={{ p: 4, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddNew}
            sx={{ 
              borderRadius: '4px',
              textTransform: 'uppercase',
              fontWeight: 500,
              py: 1
            }}
          >
            Add New
          </Button>
          <Typography variant="h6" color="text.secondary">
            Total: {certificates.length} certificates
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : certificates.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <DescriptionIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No certificates found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add your first certificate to get started
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Certificate Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Issued By</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Issue Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Expiration Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {certificates.map((certificate) => (
                  <TableRow key={certificate.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                          component="span"
                          sx={{
                            cursor: 'pointer',
                            color: 'text.primary',
                            fontWeight: 500,
                            '&:hover': {
                              color: 'text.primary',
                              textDecoration: 'underline'
                            },
                            transition: 'all 0.2s ease'
                          }}
                          onClick={() => handleCertificateClick(certificate)}
                        >
                          {certificate.name}
                        </Typography>
                        {certificate.comments && (
                          <Tooltip title="Has comments">
                            <CommentIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{certificate.issuedBy}</TableCell>
                    <TableCell>{formatDate(certificate.issueDate)}</TableCell>
                    <TableCell>{formatDate(certificate.expirationDate)}</TableCell>
                    <TableCell>
                      {isPermanent(certificate.expirationDate) ? (
                        <Chip label="Permanent" color="info" size="small" />
                      ) : isExpired(certificate.expirationDate) ? (
                        <Chip label="Expired" color="error" size="small" />
                      ) : isExpiringSoon(certificate.expirationDate) ? (
                        <Chip label="Expiring Soon" color="warning" size="small" />
                      ) : (
                        <Chip label="Valid" color="success" size="small" />
                      )}
                    </TableCell>


                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Add Certificate Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '12px' }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" component="div">
            {isEditing ? 'Edit Certificate' : 'Add New Certificate'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Autocomplete
                options={CERTIFICATE_OPTIONS}
                value={formData.name}
                onChange={(_, value) => {
                  let certificateName = value || '';
                  // Handle custom certificate option
                  if (certificateName.startsWith('Add "') && certificateName.endsWith('"')) {
                    certificateName = certificateName.slice(5, -1); // Remove 'Add "' and '"'
                  }
                  setFormData({ ...formData, name: certificateName });
                }}
                onInputChange={(_, value) => setFormData({ ...formData, name: value || '' })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Certificate Name"
                    fullWidth
                    required
                    variant="outlined"
                    helperText="Type your own certificate name or select from suggestions"
                  />
                )}
                freeSolo
                selectOnFocus
                clearOnBlur
                handleHomeEndKeys
                filterOptions={(options, { inputValue }) => {
                  const filtered = options.filter(option =>
                    option.toLowerCase().includes(inputValue.toLowerCase())
                  );
                  // Show suggestion to add custom certificate if no matches
                  if (inputValue !== '' && !filtered.some(option => 
                    option.toLowerCase() === inputValue.toLowerCase()
                  )) {
                    filtered.push(`Add "${inputValue}"`);
                  }
                  return filtered;
                }}
                renderOption={(props, option) => {
                  if (option.startsWith('Add "')) {
                    return (
                      <Box component="li" {...props} sx={{ 
                        fontStyle: 'italic', 
                        color: 'primary.main',
                        backgroundColor: 'primary.50'
                      }}>
                        <AddIcon sx={{ mr: 1, fontSize: 18 }} />
                        {option}
                      </Box>
                    );
                  }
                  return <Box component="li" {...props}>{option}</Box>;
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Issued By"
                fullWidth
                required
                variant="outlined"
                value={formData.issuedBy}
                onChange={(e) => setFormData({ ...formData, issuedBy: e.target.value })}
                autoComplete="off"
                InputProps={{
                  startAdornment: <BusinessIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>

            <Grid item xs={6}>
              <AppDatePicker
                label="Issue Date"
                value={formData.issueDate}
                onChange={(date) => setFormData({ ...formData, issueDate: date || '' })}
                required
                placeholder="dd/mm/yyyy"
              />
            </Grid>

            <Grid item xs={6}>
              <AppDatePicker
                label="Expiration Date"
                value={formData.expirationDate}
                onChange={(date) => setFormData({ ...formData, expirationDate: date || '' })}
                required={!hasNoExpiration}
                placeholder="dd/mm/yyyy"
                disabled={hasNoExpiration}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={hasNoExpiration}
                    onChange={(e) => {
                      setHasNoExpiration(e.target.checked);
                      if (e.target.checked) {
                        setFormData({ ...formData, expirationDate: '' });
                      }
                    }}
                    size="small"
                    sx={{ py: 0.5 }}
                  />
                }
                label="No expiration"
                sx={{ 
                  mt: 1,
                  '& .MuiFormControlLabel-label': { 
                    fontSize: '0.875rem',
                    color: 'text.secondary'
                  }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Comments"
                fullWidth
                multiline
                rows={2}
                variant="outlined"
                value={formData.comments}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                placeholder="Additional notes or comments"
              />
            </Grid>

            <Grid item xs={12}>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              <Box 
                onClick={handleFileAreaClick}
                sx={{ 
                  border: '2px dashed #e0e0e0',
                  borderRadius: '8px',
                  p: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: 'action.hover'
                  }
                }}
              >
                {selectedFile ? (
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                      <DescriptionIcon sx={{ fontSize: 48, color: 'success.main' }} />
                    </Box>
                    <Typography variant="body1" color="success.main" sx={{ fontWeight: 500 }}>
                      ✓ {selectedFile.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      File size: {(selectedFile.size / 1024).toFixed(1)} KB
                    </Typography>
                    <Button
                      onClick={handleRemoveFile}
                      size="small"
                      color="error"
                      sx={{ mt: 2 }}
                    >
                      Remove File
                    </Button>
                  </>
                ) : (
                  <>
                    <AttachFileIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body1" color="text.secondary">
                      Click to attach certificate file
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Supported formats: PDF, DOC, DOCX, JPG, PNG
                    </Typography>
                  </>
                )}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1, justifyContent: 'space-between' }}>
          <Button onClick={handleCloseDialog} color="inherit">
            Close
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!formData.name || !formData.issuedBy || !formData.issueDate || (!hasNoExpiration && !formData.expirationDate)}
            sx={{ 
              borderRadius: '4px',
              textTransform: 'uppercase',
              fontWeight: 500
            }}
          >
            {isEditing ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '12px' }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeleteIcon sx={{ color: 'error.main' }} />
            <Typography variant="h6" component="div">
              Delete Certificate
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to delete this certificate?
          </Typography>
          {certificateToDelete && (
                         <Box sx={{ 
               backgroundColor: 'background.default', 
               p: 2, 
               borderRadius: '8px', 
               mt: 2,
               border: '1px solid',
               borderColor: 'divider'
             }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                {certificateToDelete.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Issued by: {certificateToDelete.issuedBy}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Expires: {formatDate(certificateToDelete.expirationDate)}
              </Typography>
            </Box>
          )}
          <Typography variant="body2" sx={{ mt: 3, mb: 1, color: 'error.main', fontWeight: 500 }}>
            To confirm deletion, type "Delete" in the field below:
          </Typography>
          <TextField
            fullWidth
            placeholder="Type 'Delete' to confirm"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            variant="outlined"
            size="small"
            autoComplete="off"
            sx={{
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': {
                  borderColor: deleteConfirmText === 'Delete' ? 'success.main' : 'error.main',
                },
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={handleDeleteCancel} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            disabled={deleteConfirmText !== 'Delete'}
            sx={{ 
              borderRadius: '4px',
              textTransform: 'uppercase',
              fontWeight: 500
            }}
          >
            Delete Certificate
          </Button>
        </DialogActions>
      </Dialog>

      {/* Certificate Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={handleDetailsClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '12px' }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DescriptionIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6" component="div">
              Certificate Details
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedCertificate && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box sx={{ 
                  backgroundColor: 'background.default',
                  p: 3,
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: 'divider'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      {selectedCertificate.name}
                    </Typography>
                    <Tooltip title="Delete certificate">
                      <IconButton 
                        size="small" 
                        onClick={() => {
                          if (selectedCertificate) {
                            handleDeleteClick(selectedCertificate);
                          }
                        }}
                        sx={{ 
                          backgroundColor: 'background.default',
                          color: 'error.main',
                          width: 32,
                          height: 32,
                          border: '1px solid',
                          borderColor: 'error.main',
                          '&:hover': { 
                            backgroundColor: 'error.main',
                            color: 'white',
                            transform: 'scale(1.1)'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Issued By
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedCertificate.issuedBy}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Status
                      </Typography>
                      <Box>
                        {isPermanent(selectedCertificate.expirationDate) ? (
                          <Chip label="Permanent" color="info" size="small" />
                        ) : isExpired(selectedCertificate.expirationDate) ? (
                          <Chip label="Expired" color="error" size="small" />
                        ) : isExpiringSoon(selectedCertificate.expirationDate) ? (
                          <Chip label="Expiring Soon" color="warning" size="small" />
                        ) : (
                          <Chip label="Valid" color="success" size="small" />
                        )}
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Issue Date
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(selectedCertificate.issueDate)}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Expiration Date
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(selectedCertificate.expirationDate)}
                      </Typography>
                    </Grid>
                    
                    {selectedCertificate.comments && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Comments
                        </Typography>
                        <Typography variant="body1" sx={{ 
                          backgroundColor: 'action.hover',
                          p: 1.5,
                          borderRadius: '4px',
                          fontStyle: 'italic'
                        }}>
                          {selectedCertificate.comments}
                        </Typography>
                      </Grid>
                    )}
                    
                    {selectedCertificate.fileName && (
                      <Grid item xs={12}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1,
                          backgroundColor: 'action.hover',
                          p: 0.75,
                          borderRadius: '4px'
                        }}>
                          <AttachFileIcon sx={{ color: 'text.secondary', fontSize: 16 }} />
                          <Typography variant="caption" sx={{ flex: 1, fontSize: '0.8rem' }}>
                            {generateDownloadFileName(selectedCertificate)}
                          </Typography>
                          {selectedCertificate.fileName && (
                            <Tooltip title="Download file">
                              <IconButton
                                size="medium"
                                onClick={() => handleFileOpen(selectedCertificate)}
                                sx={{ 
                                  p: 1,
                                  '&:hover': { 
                                    backgroundColor: 'primary.main',
                                    color: 'white'
                                  }
                                }}
                              >
                                <DownloadIcon sx={{ fontSize: 20 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1, justifyContent: 'space-between' }}>
          <Button onClick={handleDetailsClose} color="inherit">
            Close
          </Button>
          <Button
            onClick={handleEditClick}
            variant="contained"
            startIcon={<EditIcon />}
            sx={{ 
              borderRadius: '4px',
              textTransform: 'uppercase',
              fontWeight: 500
            }}
          >
            Edit
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default VesselCertificates; 