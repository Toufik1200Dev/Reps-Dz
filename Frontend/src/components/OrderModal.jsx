import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Grid,
    Typography,
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Divider,
    Alert,
    IconButton,
    RadioGroup,
    FormControlLabel,
    Radio,
    FormLabel
  Grid,
} from '@mui/material';
import { Close, LocalShipping, CheckCircle } from '@mui/icons-material';
import { ordersAPI, apiUtils } from '../services/api';

const OrderModal = ({ open, onClose, product, quantity = 1, size, color }) => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    const [shippingInfo, setShippingInfo] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        street: '',
        city: '',
        state: '',
        postalCode: '',
        wilaya: '',
        commune: ''
    });

    const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');

    // Hardcoded wilayas for demo functionality (since Checkout.jsx had empty state)
    const wilayas = [
        { id: '16', name: 'Alger' },
        { id: '31', name: 'Oran' },
        { id: '06', name: 'Bejaia' },
        { id: '25', name: 'Constantine' },
        { id: '15', name: 'Tizi Ouzou' }
    ];

    const calculateSubtotal = () => {
        if (!product) return 0;
        return (parseFloat(product.price) || 0) * quantity;
    };

    const calculateShipping = () => {
        const subtotal = calculateSubtotal();
        return subtotal > 10000 ? 0 : 700; // Flat rate for demo
    };

    const calculateTotal = () => {
        return calculateSubtotal() + calculateShipping();
    };

    const handleChange = (e) => {
        setShippingInfo({
            ...shippingInfo,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            setError(null);

            // Construct order payload matches Checkout.jsx logic
            // ordersAPI expects orderData with product, shipping, payment
            const orderData = {
                customer: {
                    fullName: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
                    email: shippingInfo.email,
                    phone: shippingInfo.phone,
                    address: `${shippingInfo.street}, ${shippingInfo.city}, ${shippingInfo.postalCode}`,
                    wilaya: wilayas.find(w => w.id === shippingInfo.wilaya)?.name || shippingInfo.wilaya,
                    commune: shippingInfo.commune
                },
                products: [{
                    product: product._id || product.id, // ID reference
                    name: product.name,
                    price: parseFloat(product.price),
                    quantity: quantity,
                    size: size,
                    color: color,
                    image: product.images?.main || product.image
                }],
                shippingInfo: {
                    ...shippingInfo,
                    wilaya: wilayas.find(w => w.id === shippingInfo.wilaya)?.name || shippingInfo.wilaya
                },
                paymentMethod,
                orderTotal: calculateSubtotal(),
                shippingCost: calculateShipping(),
                tax: 0, // Simplified
                totalAmount: calculateTotal()
            };

            // Depending on API structure (apiUtils.formatOrderData vs direct payload)
            // Checkout.jsx uses apiUtils.formatOrderData. 
            // Keep it simple and use direct payload consistent with Backend orderController.
            // Backend expects: customer, products, totalAmount, paymentMethod

            await ordersAPI.createOrder(orderData);
            setSuccess(true);

            // Auto close after 3 seconds
            setTimeout(() => {
                handleClose();
            }, 3000);

        } catch (err) {
            console.error("Order failed", err);
            setError(err.message || 'Failed to place order');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSuccess(false);
        setError(null);
        onClose();
    };

    if (!product) return null;

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            {success ? (
                <Box p={6} textAlign="center">
                    <CheckCircle sx={{ fontSize: 60, color: 'green', mb: 2 }} />
                    <Typography variant="h4" gutterBottom>Order Confirmed!</Typography>
                    <Typography color="text.secondary">Your order for {product.name} has been placed successfully.</Typography>
                    <Button onClick={handleClose} sx={{ mt: 3 }} variant="outlined">Close</Button>
                </Box>
            ) : (
                <>
                    <DialogTitle>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            Purchase {product.name}
                            <IconButton onClick={handleClose}><Close /></IconButton>
                        </Box>
                    </DialogTitle>
                    <DialogContent dividers>
                        <Grid container spacing={4}>
                            {/* Left: Product Summary */}
                            <Grid size={{ xs: 12, md: 5 }}>
                                <Box p={2} border="1px solid #eee" borderRadius={2} mb={3}>
                                    <img
                                        src={product.images?.main || product.image || "/placeholder.jpg"}
                                        alt={product.name}
                                        style={{ width: '100%', borderRadius: 8, marginBottom: 16 }}
                                    />
                                    <Typography variant="h6">{product.name}</Typography>
                                    <Box display="flex" justifyContent="space-between" mt={1}>
                                        <Typography color="text.secondary">Quantity:</Typography>
                                        <Typography fontWeight="bold">{quantity}</Typography>
                                    </Box>
                                    {size && (
                                        <Box display="flex" justifyContent="space-between" mt={1}>
                                            <Typography color="text.secondary">Size:</Typography>
                                            <Typography fontWeight="bold">{size}</Typography>
                                        </Box>
                                    )}
                                    <Divider sx={{ my: 2 }} />
                                    <Box display="flex" justifyContent="space-between">
                                        <Typography>Subtotal</Typography>
                                        <Typography>{calculateSubtotal()} DA</Typography>
                                    </Box>
                                    <Box display="flex" justifyContent="space-between">
                                        <Typography>Shipping</Typography>
                                        <Typography>{calculateShipping() === 0 ? "Free" : `${calculateShipping()} DA`}</Typography>
                                    </Box>
                                    <Box display="flex" justifyContent="space-between" mt={2}>
                                        <Typography variant="h6">Total</Typography>
                                        <Typography variant="h6" color="primary">{calculateTotal()} DA</Typography>
                                    </Box>
                                </Box>
                            </Grid>

                            {/* Right: Form */}
                            <Grid size={{ xs: 12, md: 7 }}>
                                <Typography variant="h6" gutterBottom>Shipping Details</Typography>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 6 }}>
                                        <TextField fullWidth label="First Name" name="firstName" value={shippingInfo.firstName} onChange={handleChange} />
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                        <TextField fullWidth label="Last Name" name="lastName" value={shippingInfo.lastName} onChange={handleChange} />
                                    </Grid>
                                    <Grid size={{ xs: 12 }}>
                                        <TextField fullWidth label="Phone" name="phone" value={shippingInfo.phone} onChange={handleChange} />
                                    </Grid>
                                    <Grid size={{ xs: 12 }}>
                                        <TextField fullWidth label="Address" name="street" value={shippingInfo.street} onChange={handleChange} />
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                        <FormControl fullWidth>
                                            <InputLabel>Wilaya</InputLabel>
                                            <Select name="wilaya" value={shippingInfo.wilaya} label="Wilaya" onChange={handleChange}>
                                                {wilayas.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                        <TextField fullWidth label="Commune" name="commune" value={shippingInfo.commune} onChange={handleChange} />
                                    </Grid>
                                </Grid>

                                <Box mt={3}>
                                    <Typography variant="h6" gutterBottom>Payment</Typography>
                                    <RadioGroup value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                                        <FormControlLabel value="cash_on_delivery" control={<Radio />} label="Cash on Delivery" />
                                        <FormControlLabel value="bank_transfer" control={<Radio />} label="CCP / Bank Transfer" />
                                    </RadioGroup>
                                </Box>

                                {error && (
                                    <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
                                )}
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ p: 3 }}>
                        <Button onClick={handleClose} size="large">Cancel</Button>
                        <Button
                            variant="contained"
                            color="primary"
                            size="large"
                            onClick={handleSubmit}
                            disabled={loading || !shippingInfo.firstName || !shippingInfo.phone}
                        >
                            {loading ? 'Processing...' : 'Place Order Now'}
                        </Button>
                    </DialogActions>
                </>
            )}
        </Dialog>
    );
};

export default OrderModal;
