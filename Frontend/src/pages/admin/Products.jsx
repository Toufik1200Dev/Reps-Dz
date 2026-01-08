import React, { useState, useEffect, useMemo } from 'react';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  Check as CheckIcon,
  Inventory as InventoryIcon,
  AttachMoney as ActionIcon
} from '@mui/icons-material';
import { productsAPI, apiUtils } from '../../services/api';

/**
 * Image Upload Component
 * Uploads file immediately and returns URL to parent
 */
const ImageUploader = ({ label, showPreview, imageUrl, onUpload, onRemove, multiple = false }) => {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      // Upload sequentially or parallel
      for (const file of files) {
        const res = await productsAPI.uploadImage(file);
        console.log('📸 Upload response:', res);
        
        // Backend returns: { success: true, data: { url: ... } }
        const url = res.data?.url || res.url || (res.data && res.data);
        console.log('🔗 Extracted URL:', url);
        
        if (url) {
          console.log('✅ Calling onUpload with URL:', url);
          onUpload(url);
        } else {
          console.error('❌ No URL in upload response:', res);
          alert('Image uploaded but URL not found. Response: ' + JSON.stringify(res));
        }
      }
    } catch (error) {
      console.error('Upload failed', error);
      
      // Show detailed error message
      let errorMessage = 'Image upload failed';
      
      if (error.message) {
        errorMessage = error.message;
        
        // If it's an authentication error, make it more prominent
        if (error.message.includes('password') || error.message.includes('Authentication')) {
          errorMessage = `🔐 Authentication Error\n\n${error.message}\n\nPlease log out and log back in with the correct admin password.`;
        }
      }
      
      alert(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const inputId = `upload-${label || 'image'}-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-bold mb-2 text-gray-700">{label}</label>}

      {/* Preview Area for Single Image */}
      {showPreview && imageUrl && !multiple && (
        <div className="relative w-40 h-40 mb-3 group">
          <img 
            src={imageUrl} 
            alt="Preview" 
            className="w-full h-full object-cover rounded-lg border-2 border-gray-200 shadow-sm"
            onError={(e) => {
              console.error('❌ Image load error:', imageUrl);
              e.target.style.display = 'none';
            }}
          />
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
          >
            <CloseIcon fontSize="small" />
          </button>
        </div>
      )}

      {/* Upload Button */}
      <div className="relative">
        <input
          type="file"
          accept="image/*"
          multiple={multiple}
          onChange={handleFileChange}
          className="hidden"
          id={inputId}
          disabled={uploading}
        />
        <label
          htmlFor={inputId}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed cursor-pointer transition-colors min-h-[100px] ${uploading ? 'bg-gray-100 border-gray-300 cursor-not-allowed' : 'bg-gray-50 border-gray-300 hover:border-secondary hover:bg-secondary/10'}`}
        >
          <CloudUploadIcon className={uploading ? 'text-gray-400' : 'text-secondary'} />
          <span className="text-sm font-medium text-gray-600">{uploading ? 'Uploading...' : 'Click to Upload'}</span>
        </label>
      </div>
    </div>
  );
};

const ProductForm = ({ initialData, onSubmit, onCancel }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category: '',
    shortDescription: '',
    description: '',
    price: '',
    discount: 0,
    stock: 0,
    lowStockAlert: 5,
    status: 'Active',
    variants: { sizes: [], colors: [] },
    specifications: {
      material: '',
      weight: '',
      maxLoad: '',
      usage: 'Both',
      difficulty: 'All Levels',
      bodyTarget: []
    },
    images: { main: '', gallery: [] },
    tags: []
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        // Ensure nested structures exist
        variants: initialData.variants || { sizes: [], colors: [] },
        specifications: initialData.specifications || { material: '', weight: '', maxLoad: '', usage: 'Both', difficulty: 'All Levels', bodyTarget: [] },
        images: initialData.images || { main: '', gallery: [] },
        tags: initialData.tags || []
      });
    }
  }, [initialData]);

  const handleChange = (path, value) => {
    setFormData(prev => {
      const newData = { ...prev };
      // Handle nested paths like 'images.main' or 'images.gallery'
      if (path.includes('.')) {
        const parts = path.split('.');
        if (parts.length === 2) {
          const [parent, child] = parts;
          newData[parent] = { ...newData[parent], [child]: value };
        } else if (parts.length === 3) {
          // Handle deeper nesting like 'variants.sizes'
          const [parent, child, grandchild] = parts;
          newData[parent] = { 
            ...newData[parent], 
            [child]: { ...newData[parent]?.[child], [grandchild]: value }
          };
        }
      } else {
        newData[path] = value;
      }
      console.log('🔄 handleChange:', { path, value, newData });
      return newData;
    });
  };

  const handleArrayToggle = (path, value) => {
    setFormData(prev => {
      const [parent, child] = path.split('.');
      const currentArray = parent === 'tags' ? prev.tags : prev[parent][child];
      const exists = currentArray.includes(value);

      let newArray;
      if (exists) newArray = currentArray.filter(item => item !== value);
      else newArray = [...currentArray, value];

      if (parent === 'tags') return { ...prev, tags: newArray };
      return {
        ...prev,
        [parent]: { ...prev[parent], [child]: newArray }
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const tabs = [
    { id: 'general', label: 'Basic Info' },
    { id: 'pricing', label: 'Pricing & Stock' },
    { id: 'variants', label: 'Variants' },
    { id: 'specs', label: 'Specifications' },
    { id: 'images', label: 'Images' }
  ];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 px-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === tab.id ? 'border-secondary text-black' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'general' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-1">Product Name *</label>
                <input
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-secondary"
                  value={formData.name}
                  onChange={e => handleChange('name', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Category *</label>
                <select
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-secondary"
                  value={formData.category}
                  onChange={e => handleChange('category', e.target.value)}
                  required
                >
                  <option value="">Select Category</option>
                  <option value="pull up bar">Pull Up Bar</option>
                  <option value="paralleles">Paralleles</option>
                  <option value="supplements">Supplements</option>
                  <option value="gym">Gym</option>
                  <option value="accessoire">Accessoire</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Short Description *</label>
              <input
                className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-secondary"
                value={formData.shortDescription}
                onChange={e => handleChange('shortDescription', e.target.value)}
                placeholder="Brief summary for cards..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Full Description *</label>
              <textarea
                className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-secondary h-32"
                value={formData.description}
                onChange={e => handleChange('description', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Tags</label>
              <input
                className="w-full p-2 border border-gray-200 rounded-lg mb-2"
                placeholder="Type and press Enter to add tag (Simulated for now, enter comma separated)"
                onBlur={e => {
                  if (e.target.value) handleChange('tags', e.target.value.split(',').map(s => s.trim()))
                }}
                defaultValue={formData.tags.join(', ')}
              />
            </div>
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-1">Base Price (DA) *</label>
                <input
                  type="number"
                  className="w-full p-2 border border-gray-200 rounded-lg"
                  value={formData.price}
                  onChange={e => handleChange('price', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Discount (%)</label>
                <input
                  type="number"
                  className="w-full p-2 border border-gray-200 rounded-lg"
                  value={formData.discount}
                  onChange={e => handleChange('discount', e.target.value)}
                />
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="text-sm text-gray-500">Estimated Final Price</div>
              <div className="text-2xl font-black font-display text-green-600">
                {formData.price ? (formData.price - (formData.price * (formData.discount / 100))).toLocaleString() : '0'} DA
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-1">Stock Quantity *</label>
                <input
                  type="number"
                  className="w-full p-2 border border-gray-200 rounded-lg"
                  value={formData.stock}
                  onChange={e => handleChange('stock', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Low Stock Alert</label>
                <input
                  type="number"
                  className="w-full p-2 border border-gray-200 rounded-lg"
                  value={formData.lowStockAlert}
                  onChange={e => handleChange('lowStockAlert', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-1">Status</label>
              <select
                className="w-full p-2 border border-gray-200 rounded-lg"
                value={formData.status}
                onChange={e => handleChange('status', e.target.value)}
              >
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
                <option value="Hidden">Hidden</option>
                <option value="Out of stock">Out of Stock</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'variants' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold mb-2">Sizes Available</label>
              <div className="flex flex-wrap gap-2">
                {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'].map(size => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handleArrayToggle('variants.sizes', size)}
                    className={`px-4 py-2 rounded-lg border text-sm font-bold transition-all ${formData.variants.sizes.includes(size)
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-black'
                      }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Colors Available</label>
              <input
                type="text"
                placeholder="Enter color name/hex and Press Enter (Comma separated for now)"
                className="w-full p-2 border border-gray-200 rounded-lg"
                defaultValue={formData.variants.colors.join(', ')}
                onBlur={e => {
                  if (e.target.value) {
                    const colors = e.target.value.split(',').map(c => c.trim()).filter(Boolean);
                    handleChange('variants.colors', colors);
                  }
                }}
              />
              <div className="flex gap-2 mt-2">
                {formData.variants.colors.map(c => (
                  <span key={c} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">{c}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'specs' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-1">Material</label>
                <input
                  className="w-full p-2 border border-gray-200 rounded-lg"
                  value={formData.specifications.material}
                  onChange={e => handleChange('specifications.material', e.target.value)}
                  placeholder="e.g. Steel, Wood"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Difficulty Level</label>
                <select
                  className="w-full p-2 border border-gray-200 rounded-lg"
                  value={formData.specifications.difficulty}
                  onChange={e => handleChange('specifications.difficulty', e.target.value)}
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="All Levels">All Levels</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-1">Weight (kg)</label>
                <input
                  type="number"
                  className="w-full p-2 border border-gray-200 rounded-lg"
                  value={formData.specifications.weight}
                  onChange={e => handleChange('specifications.weight', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Max Load (kg)</label>
                <input
                  type="number"
                  className="w-full p-2 border border-gray-200 rounded-lg"
                  value={formData.specifications.maxLoad}
                  onChange={e => handleChange('specifications.maxLoad', e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Usage Environment</label>
              <select
                className="w-full p-2 border border-gray-200 rounded-lg"
                value={formData.specifications.usage}
                onChange={e => handleChange('specifications.usage', e.target.value)}
              >
                <option value="Indoor">Indoor</option>
                <option value="Outdoor">Outdoor</option>
                <option value="Both">Both</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Body Target Areas</label>
              <div className="flex flex-wrap gap-2">
                {['Upper Body', 'Core', 'Legs', 'Full Body', 'Pulling', 'Pushing'].map(area => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => handleArrayToggle('specifications.bodyTarget', area)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${formData.specifications.bodyTarget.includes(area)
                        ? 'bg-secondary text-black'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'images' && (
          <div className="space-y-6">
            <div>
              <ImageUploader
                label="Main Product Image (Required)"
                showPreview={true}
                imageUrl={formData.images.main}
                onUpload={(url) => handleChange('images.main', url)}
                onRemove={() => handleChange('images.main', '')}
              />
            </div>

            <div className="border-t border-gray-100 pt-6">
              <label className="block text-sm font-bold mb-4 text-gray-700">Gallery Images</label>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {formData.images?.gallery && formData.images.gallery.length > 0 && formData.images.gallery.map((url, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group border-2 border-gray-200 shadow-sm">
                    <img 
                      src={url} 
                      alt={`Gallery ${idx + 1}`} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('❌ Gallery image load error:', url);
                        e.target.style.display = 'none';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newGallery = formData.images.gallery.filter((_, i) => i !== idx);
                        handleChange('images.gallery', newGallery);
                      }}
                      className="absolute top-1 right-1 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10 hover:bg-red-700"
                    >
                      <CloseIcon fontSize="small" />
                    </button>
                  </div>
                ))}
                <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors">
                  <ImageUploader
                    label=""
                    showPreview={false}
                    multiple={true}
                    onUpload={(url) => {
                      const currentGallery = formData.images.gallery || [];
                      handleChange('images.gallery', [...currentGallery, url]);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 rounded-lg font-bold text-gray-500 hover:text-black hover:bg-white transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-8 py-2 bg-black text-secondary rounded-lg font-bold hover:bg-gray-900 transition-colors shadow-lg shadow-black/10"
        >
          Save Product
        </button>
      </div>
    </form>
  );
};

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await productsAPI.getAllProducts();
      setProducts(res.data?.products || res.data || []);
    } catch (error) {
      console.error('Failed to load products', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleEdit = (product) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await productsAPI.delete(id);
      fetchProducts();
    } catch (error) {
      alert('Failed to delete product');
    }
  };

  const handleFormSubmit = async (data) => {
    try {
      // Convert simplified structure to API payload if needed, 
      // but our form structure matches schema pretty well.
      // Handle JSON serialization if the API expects it, but we are sending JSON body.
      // The service `productsAPI.create` handles JSON or FormData. 
      // Since we uploading images async, we have URLs in data. So Just JSON is fine.

      if (editingProduct) {
        await productsAPI.update(editingProduct.id || editingProduct._id, data);
      } else {
        await productsAPI.create(data);
      }
      setModalOpen(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error(error);
      alert('Failed to save product: ' + (error.response?.data?.message || error.message));
    }
  };

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q));
  }, [products, search]);

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-display font-black mb-2">Products Management</h1>
          <p className="text-gray-500">Add, edit, and organize your equipment inventory.</p>
        </div>
        <button
          onClick={() => { setEditingProduct(null); setModalOpen(true); }}
          className="bg-black text-secondary px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-900 transition-transform hover:-translate-y-1 shadow-lg shadow-black/20"
        >
          <AddIcon />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-8 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-secondary transition-colors"
            placeholder="Search products by name, category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-2">
            <FilterIcon fontSize="small" /> Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="p-4 pl-6 text-sm font-bold text-gray-500 uppercase tracking-wider">Product</th>
                <th className="p-4 text-sm font-bold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="p-4 text-sm font-bold text-gray-500 uppercase tracking-wider">Price/Stock</th>
                <th className="p-4 text-sm font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-right text-sm font-bold text-gray-500 uppercase tracking-wider pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center">Loading...</td></tr>
              ) : filteredProducts.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500">No products found.</td></tr>
              ) : (
                filteredProducts.map(product => (
                  <tr key={product.id || product._id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg bg-gray-100 border border-gray-100 overflow-hidden flex-shrink-0">
                          <img
                            src={product.images?.main || (product.images?.[0]?.url) || product.image || '/placeholder-product.png'}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 group-hover:text-black transition-colors">{product.name}</h3>
                          <p className="text-xs text-gray-500 line-clamp-1">{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold uppercase tracking-wide">
                        {product.category}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-gray-900 font-mono">
                        {product.finalPrice ? product.finalPrice.toLocaleString() : product.price?.toLocaleString()} DA
                      </div>
                      <div className={`text-xs font-bold ${product.stock > 10 ? 'text-green-600' : 'text-orange-500'}`}>
                        {product.stock} items left
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${product.status === 'Active' ? 'bg-green-50 text-green-700 border-green-100' :
                          product.status === 'Draft' ? 'bg-gray-50 text-gray-600 border-gray-100' :
                            'bg-red-50 text-red-700 border-red-100'
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${product.status === 'Active' ? 'bg-green-500' :
                            product.status === 'Draft' ? 'bg-gray-400' :
                              'bg-red-500'
                          }`}></span>
                        {product.status || (product.inStock ? 'Active' : 'Out of stock')}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit(product)} className="p-2 text-gray-400 hover:text-black hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-gray-100">
                          <EditIcon fontSize="small" />
                        </button>
                        <button onClick={() => handleDelete(product.id || product._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                          <DeleteIcon fontSize="small" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center text-sm text-gray-500">
          <span>Showing {filteredProducts.length} items</span>
          {/* Pagination could go here */}
        </div>
      </div>

      {/* Modal Overlay */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-2xl font-display font-black">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={() => { setModalOpen(false); setEditingProduct(null); }} className="p-2 hover:bg-gray-100 rounded-full">
                <CloseIcon />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ProductForm
                initialData={editingProduct}
                onSubmit={handleFormSubmit}
                onCancel={() => { setModalOpen(false); setEditingProduct(null); }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
