import React, { useState } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Button,
  Box,
  IconButton,
  TextField,
  Divider,
  Chip,
  useTheme,
  useMediaQuery,
  Alert,
  LinearProgress,
  Grid,
} from '@mui/material';
import {
  Add,
  Remove,
  Delete,
  ShoppingCart,
  ArrowBack,
  LocalShipping,
  Security,
  Support,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';

export default function Cart() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { items: cartItems, updateQuantity, removeFromCart, totalPrice: cartTotalPrice } = useCart();

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    updateQuantity(itemId, newQuantity);
  };

  const handleRemoveItem = (itemId) => {
    removeFromCart(itemId);
  };

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

  const handleCheckout = () => {
    console.log('Proceeding to checkout...');
    navigate('/checkout');
  };

  const handleContinueShopping = () => {
    navigate('/shop');
  };

  if (cartItems.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center' }}>
          <ShoppingCart sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Your cart is empty
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Looks like you haven't added any items to your cart yet.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={handleContinueShopping}
            startIcon={<ArrowBack />}
          >
            Continue Shopping
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Shopping Cart
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in your cart
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Cart Items */}
        <Grid size={{ xs: 12, lg: 8 }}>
          {cartItems.map((item) => {
            const itemId = item.id || item._id;
            const itemImage = item.image || item.images?.[0]?.url || item.images?.[0] || '';
            const itemPrice = parseFloat(item.price) || 0;

            return (
              <Card key={itemId} sx={{ mb: 3 }}>
                <CardContent>
                  <Grid container spacing={3} alignItems="center">
                    {/* Product Image */}
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <CardMedia
                        component="img"
                        height="120"
                        image={itemImage}
                        alt={item.name}
                        sx={{ borderRadius: 1, objectFit: 'cover' }}
                      />
                    </Grid>

                    {/* Product Info */}
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Typography variant="subtitle1" component={Link} to={`/product/${item.productId || item.id}`} sx={{ textDecoration: 'none', color: 'text.primary', fontWeight: 'bold' }}>
                        {item.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                        {item.size && (
                          <Chip label={`Size: ${item.size}`} size="small" variant="outlined" sx={{ height: 24, fontSize: '0.75rem' }} />
                        )}
                        {item.color && (
                          <Chip
                            label={item.color}
                            size="small"
                            variant="outlined"
                            sx={{
                              height: 24,
                              fontSize: '0.75rem',
                              '& .MuiChip-label': { px: 1 },
                              borderColor: item.color.toLowerCase() === 'white' ? 'grey.300' : item.color
                            }}
                            icon={<Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: item.color, border: '1px solid rgba(0,0,0,0.1)' }} />}
                          />
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {item.price} DA
                      </Typography>
                      {item.badge && (
                        <Chip
                          label={item.badge}
                          color="primary"
                          size="small"
                        />
                      )}
                    </Grid>

                    {/* Quantity Controls */}
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton
                          size="small"
                          onClick={() => updateQuantity(item.uniqueId || item._id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Remove fontSize="small" />
                        </IconButton>
                        <Typography sx={{ mx: 2 }}>{item.quantity}</Typography>
                        <IconButton
                          size="small"
                          onClick={() => updateQuantity(item.uniqueId || item._id, item.quantity + 1)}
                          disabled={(item.stock && item.quantity >= item.stock)}
                        >
                          <Add fontSize="small" />
                        </IconButton>
                        <IconButton
                          color="error"
                          sx={{ ml: 2 }}
                          onClick={() => removeFromCart(item.uniqueId || item._id)}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </Grid>

                    {/* Price */}
                    <Grid size={{ xs: 12, sm: 2 }}>
                      <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                        {(itemPrice * item.quantity).toLocaleString('en-US', { maximumFractionDigits: 0 })} DA
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {itemPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })} DA each
                      </Typography>
                    </Grid>


                  </Grid>
                </CardContent>
              </Card>
            );
          })}

          {/* Continue Shopping */}
          <Box sx={{ mt: 3 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={handleContinueShopping}
            >
              Continue Shopping
            </Button>
          </Box>
        </Grid>

        {/* Order Summary */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ position: 'sticky', top: 20 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Order Summary
              </Typography>

              {/* Summary Details */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1">Subtotal</Typography>
                  <Typography variant="body1">{calculateSubtotal().toLocaleString('en-US', { maximumFractionDigits: 0 })} DA</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1">Shipping</Typography>
                  <Typography variant="body1">
                    {calculateShipping() === 0 ? 'Free' : `${calculateShipping().toLocaleString('en-US', { maximumFractionDigits: 0 })} DA`}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1">Tax</Typography>
                  <Typography variant="body1">{calculateTax().toLocaleString('en-US', { maximumFractionDigits: 0 })} DA</Typography>
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
              </Box>

              {/* Free Shipping Progress Bar */}
              {calculateSubtotal() < 10000 ? (
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      Free Shipping Progress
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                      {Math.round((calculateSubtotal() / 10000) * 100)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min((calculateSubtotal() / 10000) * 100, 100)}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'rgba(0,0,0,0.1)',
                      '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(90deg, #FFD700 0%, #FFED4E 100%)',
                        borderRadius: 4,
                      }
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Add {(10000 - calculateSubtotal()).toLocaleString('en-US', { maximumFractionDigits: 0 })} DA more for free shipping!
                  </Typography>
                </Box>
              ) : (
                <Alert severity="success" sx={{ mb: 3, backgroundColor: '#e8f5e9', color: '#2e7d32' }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    🎉 You qualify for free shipping!
                  </Typography>
                </Alert>
              )}

              {/* Checkout Button */}
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handleCheckout}
                sx={{
                  mb: 2,
                  py: 1.5,
                  borderRadius: '50px',
                  textTransform: 'none',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  background: 'linear-gradient(135deg, #000 0%, #333 100%)',
                  color: '#FFD700',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #333 0%, #000 100%)',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Proceed to Checkout
              </Button>

              {/* Features */}
              <Box sx={{ mt: 3 }}>
                <Grid container spacing={2}>
                  {[
                    { icon: <LocalShipping />, text: 'Free Shipping' },
                    { icon: <Security />, text: 'Secure Payment' },
                    { icon: <Support />, text: '24/7 Support' },
                  ].map((feature, index) => (
                    <Grid size={{ xs: 4 }} key={index}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Box sx={{ color: 'primary.main', mb: 1 }}>{feature.icon}</Box>
                        <Typography variant="caption">{feature.text}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
