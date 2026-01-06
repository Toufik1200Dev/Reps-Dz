import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { cartAPI } from '../services/api';

// Cart reducer for state management
const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM':
      // Primarily for Guest User usage (Auth uses LOAD_CART)
      const newItem = action.payload;
      // Generate a unique ID if not present (fallback)
      const uniqueId = newItem.uniqueId || newItem._id || newItem.id;

      const existingItemIndex = state.items.findIndex(item =>
        (item.uniqueId === uniqueId) ||
        (item._id && item._id === uniqueId) || // If checking against DB ID
        (!item.uniqueId && !item._id && item.id === newItem.id) // Legacy/Simple fallback
      );

      if (existingItemIndex > -1) {
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + newItem.quantity
        };
        return { ...state, items: updatedItems };
      } else {
        return {
          ...state,
          items: [...state.items, { ...newItem, uniqueId }] // Ensure uniqueId is saved
        };
      }

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item =>
          item.uniqueId !== action.payload &&
          item._id !== action.payload &&
          item.id !== action.payload // Fallback
        ),
      };

    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item => {
          const isMatch = (item.id === action.payload.id) ||
            (item._id === action.payload.id) ||
            (item.uniqueId === action.payload.id);
          return isMatch
            ? { ...item, quantity: Math.max(0, action.payload.quantity) }
            : item;
        }).filter(item => item.quantity > 0),
      };

    case 'CLEAR_CART':
      return { ...state, items: [] };

    case 'LOAD_CART':
      return { ...state, items: action.payload || [] };

    case 'UPDATE_TOTALS':
      return {
        ...state,
        totalItems: action.payload.totalItems,
        totalPrice: action.payload.totalPrice,
      };

    default:
      return state;
  }
};

// Initial state
const initialState = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
};

// Create context
const CartContext = createContext();

// Cart provider component
export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const isAuthenticated = !!localStorage.getItem('token');

  // Calculate totals whenever items change
  useEffect(() => {
    const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (totalItems !== state.totalItems || totalPrice !== state.totalPrice) {
      dispatch({
        type: 'UPDATE_TOTALS',
        payload: { totalItems, totalPrice }
      });
    }
  }, [state.items]);

  // Initial Data Load
  useEffect(() => {
    const initializeCart = async () => {
      if (isAuthenticated) {
        try {
          // 1. Sync any guest items if they exist
          const savedCart = localStorage.getItem('titoubarz-cart');
          if (savedCart) {
            const guestItems = JSON.parse(savedCart);
            if (guestItems.length > 0) {
              await cartAPI.sync(guestItems.map(item => ({
                productId: item.id || item._id,
                quantity: item.quantity,
                size: item.size,
                color: item.color
              })));
              // Clear local storage after sync
              localStorage.removeItem('titoubarz-cart');
            }
          }

          // 2. Fetch server cart
          const response = await cartAPI.get();
          dispatch({ type: 'LOAD_CART', payload: response.data || response });
        } catch (error) {
          console.error('Failed to load server cart:', error);
        }
      } else {
        // Load from LocalStorage for guest
        const savedCart = localStorage.getItem('titoubarz-cart');
        if (savedCart) {
          try {
            dispatch({ type: 'LOAD_CART', payload: JSON.parse(savedCart) });
          } catch (e) { console.error(e); }
        }
      }
    };

    initializeCart();
  }, [isAuthenticated]);

  // Persist to LocalStorage if Guest
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem('titoubarz-cart', JSON.stringify(state.items));
    }
  }, [state.items, isAuthenticated]);

  // Cart actions
  const addToCart = async (product, quantity = 1, size = null, color = null) => {
    // Optimistic UI Update or Wait for Server?
    // Let's go with Optimistic for Guest, Server-First for Auth to ensure stock/consistency?
    // Actually, hybrid is smoother if we update state immediately. 
    // But simplified approach:

    if (isAuthenticated) {
      try {
        // Normalize ID
        const productId = product.id || product._id;
        const res = await cartAPI.add({ productId, quantity, size, color });
        // Server returns full cart usually
        dispatch({ type: 'LOAD_CART', payload: res.data || res });
      } catch (error) {
        console.error('Failed to add to cart:', error);
        alert('Could not add to cart. Please try again.');
      }
    } else {
      // Guest logic
      const normalizedProduct = {
        ...product,
        id: product.id || product._id,
        _id: product._id || product.id,
        price: parseFloat(product.price) || 0,
        image: product.images?.[0]?.url || product.image || product.images?.[0] || '',
        selectedSize: size,
        selectedColor: color
      };
      // Note: The reducer needs to handle size/color differentiation for guests!
      // We'll dispatch a custom payload or update reducer.
      // Current reducer implementation might merge items by ID only, which is wrong for variants.
      // We'll update the reducer logic separately, or patch it here.

      // Creating a unique key for the item
      const uniqueId = `${normalizedProduct.id}-${size}-${color}`;
      dispatch({
        type: 'ADD_ITEM',
        payload: { ...normalizedProduct, uniqueId, quantity, size, color }
      });
    }
  };

  const removeFromCart = async (itemId) => {
    if (isAuthenticated) {
      try {
        const res = await cartAPI.remove(itemId); // itemId is the cart item _id from DB
        dispatch({ type: 'LOAD_CART', payload: res.data || res });
      } catch (error) { console.error(error); }
    } else {
      dispatch({ type: 'REMOVE_ITEM', payload: itemId });
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    if (isAuthenticated) {
      try {
        const res = await cartAPI.update(itemId, quantity);
        dispatch({ type: 'LOAD_CART', payload: res.data || res });
      } catch (error) { console.error(error); }
    } else {
      dispatch({ type: 'UPDATE_QUANTITY', payload: { id: itemId, quantity } });
    }
  };

  const clearCart = async () => {
    if (isAuthenticated) {
      try {
        await cartAPI.clear();
        dispatch({ type: 'CLEAR_CART' });
      } catch (error) { console.error(error); }
    } else {
      dispatch({ type: 'CLEAR_CART' });
      localStorage.removeItem('titoubarz-cart');
    }
  };

  const getItemQuantity = (productId, size, color) => {
    // This logic is tricky with mixed types. 
    // For now simple check
    if (isAuthenticated) {
      // Server items have product._id usually
      return state.items.find(item =>
        (item.productId === productId || item.product?._id === productId) &&
        item.size === size &&
        item.color === color
      )?.quantity || 0;
    } else {
      return state.items.find(item =>
        (item.id === productId || item._id === productId) &&
        item.size === size &&
        item.color === color
      )?.quantity || 0;
    }
  };

  const isInCart = (productId) => {
    // General check if product exists in any variant
    return state.items.some(item => item.id === productId || item._id === productId || item.productId === productId || item.product?._id === productId);
  };

  const value = {
    items: state.items,
    totalItems: state.totalItems,
    totalPrice: state.totalPrice,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isInCart,
    getItemQuantity,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
