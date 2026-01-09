import React, { useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Box,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  Divider,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ShoppingCart,
  LocalShipping,
  Payment,
  CheckCircle,
  ArrowBack,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { ordersAPI, apiUtils } from '../services/api';

const steps = ['Cart Review', 'Shipping Information', 'Payment', 'Confirmation'];

export default function Checkout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { items: cartItems, clearCart } = useCart();

  // State
  const [activeStep, setActiveStep] = useState(0);
  const [shippingInfo, setShippingInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Algeria',
  });
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [selectedWilaya, setSelectedWilaya] = useState('');
  const [selectedCommune, setSelectedCommune] = useState('');

  // Production-ready empty data - will be loaded from API
  const [wilayas, setWilayas] = useState([]);
  const [communes, setCommunes] = useState([]);

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const price = parseFloat(item.price) || 0;
      return total + (price * item.quantity);
    }, 0);
  };

  const calculateShipping = () => {
    const subtotal = calculateSubtotal();
    return subtotal > 10000 ? 0 : 1500; // Free shipping over 10000 DA
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.08; // 8% tax
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateShipping() + calculateTax();
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleShippingChange = (field, value) => {
    setShippingInfo(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePlaceOrder = async () => {
    try {
      // Format cart items for order API (apiUtils expects { product: {...}, quantity: ... })
      const formattedCartItems = cartItems.map(item => ({
        product: {
          id: item.id || item._id,
          _id: item._id || item.id,
          price: parseFloat(item.price) || 0,
          name: item.name,
        },
        quantity: item.quantity,
        size: item.size,
        color: item.color,
      }));

      const orderData = apiUtils.formatOrderData(
        formattedCartItems,
        { ...shippingInfo, wilaya: selectedWilaya, commune: selectedCommune },
        paymentMethod
      );

      const response = await ordersAPI.create(orderData);

      // Clear cart after successful order
      clearCart();
      handleNext();
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      console.error('Error placing order:', errorInfo.message);
      // TODO: Show error message to user
      alert('Error placing order: ' + errorInfo.message);
    }
  };

  const isShippingValid = () => {
    return (
      shippingInfo.firstName &&
      shippingInfo.lastName &&
      shippingInfo.email &&
      shippingInfo.phone &&
      shippingInfo.street &&
      shippingInfo.city &&
      shippingInfo.state &&
      shippingInfo.postalCode &&
      selectedWilaya &&
      selectedCommune
    );
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Your Cart
            </Typography>
            {cartItems.map((item) => {
              const itemId = item.id || item._id;
              const itemImage = item.image || item.images?.[0]?.url || item.images?.[0] || '';
              const itemPrice = parseFloat(item.price) || 0;

              return (
                <Card key={itemId} sx={{ mb: 2 }}>
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid size={{ xs: 3 }}>
                        <img
                          src={itemImage}
                          alt={item.name}
                          style={{ width: '100%', height: 'auto', borderRadius: 8 }}
                        />
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="h6">{item.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Quantity: {item.quantity}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 3 }}>
                        <Typography variant="h6" align="right">
                          {(itemPrice * item.quantity).toLocaleString('en-US', { maximumFractionDigits: 0 })} DA
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Shipping Information
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={shippingInfo.firstName}
                  onChange={(e) => handleShippingChange('firstName', e.target.value)}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={shippingInfo.lastName}
                  onChange={(e) => handleShippingChange('lastName', e.target.value)}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={shippingInfo.email}
                  onChange={(e) => handleShippingChange('email', e.target.value)}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={shippingInfo.phone}
                  onChange={(e) => handleShippingChange('phone', e.target.value)}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Street Address"
                  value={shippingInfo.street}
                  onChange={(e) => handleShippingChange('street', e.target.value)}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>Wilaya</InputLabel>
                  <Select
                    value={selectedWilaya}
                    label="Wilaya"
                    onChange={(e) => setSelectedWilaya(e.target.value)}
                  >
                    {wilayas.map((wilaya) => (
                      <MenuItem key={wilaya.id} value={wilaya.id}>
                        {wilaya.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>Commune</InputLabel>
                  <Select
                    value={selectedCommune}
                    label="Commune"
                    onChange={(e) => setSelectedCommune(e.target.value)}
                    disabled={!selectedWilaya}
                  >
                    {communes
                      .filter((commune) => commune.wilayaId === selectedWilaya)
                      .map((commune) => (
                        <MenuItem key={commune.id} value={commune.id}>
                          {commune.name}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="City"
                  value={shippingInfo.city}
                  onChange={(e) => handleShippingChange('city', e.target.value)}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Postal Code"
                  value={shippingInfo.postalCode}
                  onChange={(e) => handleShippingChange('postalCode', e.target.value)}
                  required
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Payment Method
            </Typography>
            <FormControl component="fieldset">
              <FormLabel component="legend">Select Payment Method</FormLabel>
              <RadioGroup
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <FormControlLabel
                  value="cash_on_delivery"
                  control={<Radio />}
                  label="Cash on Delivery"
                />
                <FormControlLabel
                  value="bank_transfer"
                  control={<Radio />}
                  label="Bank Transfer"
                />
                <FormControlLabel
                  value="online_payment"
                  control={<Radio />}
                  label="Online Payment (Credit Card)"
                />
              </RadioGroup>
            </FormControl>

            {paymentMethod === 'bank_transfer' && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Bank transfer details will be provided after order confirmation.
              </Alert>
            )}

            {paymentMethod === 'online_payment' && (
              <Alert severity="info" sx={{ mt: 2 }}>
                You will be redirected to our secure payment gateway.
              </Alert>
            )}
          </Box>
        );

      case 3:
        return (
          <Box sx={{ textAlign: 'center' }}>
            <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              Order Confirmed!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Thank you for your order. We'll send you a confirmation email with order details.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/')}
            >
              Continue Shopping
            </Button>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/cart')}
          sx={{ mb: 2 }}
        >
          Back to Cart
        </Button>
        <Typography variant="h3" component="h1" gutterBottom>
          Checkout
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Main Content */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card>
            <CardContent>
              {/* Stepper */}
              <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              {/* Step Content */}
              {renderStepContent(activeStep)}

              {/* Navigation Buttons */}
              {activeStep < 3 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                  <Button
                    disabled={activeStep === 0}
                    onClick={handleBack}
                  >
                    Back
                  </Button>
                  <Button
                    variant="contained"
                    onClick={activeStep === 2 ? handlePlaceOrder : handleNext}
                    disabled={
                      (activeStep === 1 && !isShippingValid()) ||
                      (activeStep === 2 && !paymentMethod)
                    }
                  >
                    {activeStep === 2 ? 'Place Order' : 'Next'}
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Order Summary */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ position: 'sticky', top: 20 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Order Summary
              </Typography>

              {/* Items */}
              {cartItems.map((item) => {
                const itemId = item.id || item._id;
                const itemPrice = parseFloat(item.price) || 0;

                return (
                  <Box key={itemId} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">
                        {item.name} x {item.quantity}
                      </Typography>
                      <Typography variant="body2">
                        {(itemPrice * item.quantity).toLocaleString('en-US', { maximumFractionDigits: 0 })} DA
                      </Typography>
                    </Box>
                  </Box>
                );
              })}

              <Divider sx={{ my: 2 }} />

              {/* Totals */}
              <Box sx={{ mb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Subtotal</Typography>
                  <Typography variant="body2">{calculateSubtotal().toLocaleString('en-US', { maximumFractionDigits: 0 })} DA</Typography>
                </Box>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Box sx={{ display: 'space-between' }}>
                  <Typography variant="body2">Shipping</Typography>
                  <Typography variant="body2">
                    {calculateShipping() === 0 ? 'Free' : `${calculateShipping().toLocaleString('en-US', { maximumFractionDigits: 0 })} DA`}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Tax</Typography>
                  <Typography variant="body2">{calculateTax().toLocaleString('en-US', { maximumFractionDigits: 0 })} DA</Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Total
                </Typography>
                <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                  {calculateTotal().toLocaleString('en-US', { maximumFractionDigits: 0 })} DA
                </Typography>
              </Box>

              {/* Free Shipping Alert */}
              {calculateSubtotal() < 10000 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Add {(10000 - calculateSubtotal()).toLocaleString('en-US', { maximumFractionDigits: 0 })} DA more for free shipping!
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
