import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Save, 
  Upload, 
  Eye, 
  Smartphone, 
  Monitor, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  RefreshCw,
  ImageIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminBannerApi } from '../../services/admin/adminBannerApi';

const presetImages = [
  { label: 'Signature Collection', url: '/images/signature-collection.jpg' },
  { label: 'Pistachio Flavour', url: '/images/pistachio.jpg' },
  { label: 'Seasonal Mango', url: '/images/seasonal-mango.jpg' },
  { label: 'Belgian Chocolate', url: '/images/chocolate.jpg' },
  { label: 'Madagascar Vanilla', url: '/images/vanilla.jpg' },
  { label: 'Craft Ingredients', url: '/images/ingredients.jpg' },
  { label: 'Parlour Store', url: '/images/store-hero.jpg' },
];

const resolveImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  if (url.startsWith('/uploads')) {
    const backendBase = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';
    return `${backendBase}${url}`;
  }
  return url;
};

const AdminBannerPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  
  const [products, setProducts] = useState([]);
  const [previewMode, setPreviewMode] = useState('desktop'); // 'desktop' | 'mobile'

  const [formData, setFormData] = useState({
    badge: 'NEW FLAVOUR',
    title: '',
    description: '',
    cta_text: 'Discover Now',
    desktop_image: '',
    mobile_image: '',
    product_id: '',
    status: 'active'
  });

  const desktopFileInputRef = useRef(null);
  const mobileFileInputRef = useRef(null);

  // Fetch banner and products catalog
  const loadData = async () => {
    try {
      setLoading(true);
      const data = await adminBannerApi.getBanner();
      if (data) {
        setProducts(data.products || []);
        if (data.banner) {
          setFormData({
            badge: data.banner.badge || 'NEW FLAVOUR',
            title: data.banner.title || '',
            description: data.banner.description || '',
            cta_text: data.banner.cta_text || 'Discover Now',
            desktop_image: data.banner.desktop_image || '',
            mobile_image: data.banner.mobile_image || '',
            product_id: data.banner.product_id ? String(data.banner.product_id) : '',
            status: data.banner.status || 'active'
          });
        }
      }
    } catch (err) {
      console.error('Failed to load banner configuration:', err);
      toast.error('Failed to load banner configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image file must be under 5MB');
      return;
    }

    try {
      if (type === 'desktop') setUploadingDesktop(true);
      if (type === 'mobile') setUploadingMobile(true);

      const res = await adminBannerApi.uploadMedia(file);
      if (res.fileUrl) {
        if (type === 'desktop') {
          setFormData(prev => ({ ...prev, desktop_image: res.fileUrl }));
          toast.success('Desktop image uploaded successfully');
        } else {
          setFormData(prev => ({ ...prev, mobile_image: res.fileUrl }));
          toast.success('Mobile image uploaded successfully');
        }
      }
    } catch (err) {
      console.error('Upload error:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to upload image');
    } finally {
      if (type === 'desktop') setUploadingDesktop(false);
      if (type === 'mobile') setUploadingMobile(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Banner title is required');
      return;
    }

    if (!formData.desktop_image.trim()) {
      toast.error('Desktop image is required');
      return;
    }

    try {
      setSaving(true);
      await adminBannerApi.updateBanner({
        ...formData,
        product_id: formData.product_id ? parseInt(formData.product_id, 10) : null
      });
      toast.success('New Flavour Banner saved successfully!');
    } catch (err) {
      console.error('Save error:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to save banner');
    } finally {
      setSaving(false);
    }
  };

  const selectedProduct = products.find(p => String(p.id) === String(formData.product_id));
  const previewDesktopImg = resolveImageUrl(formData.desktop_image) || '/images/signature-collection.jpg';
  const previewMobileImg = resolveImageUrl(formData.mobile_image) || previewDesktopImg;
  const displayPrice = selectedProduct?.price ? `₹${parseFloat(selectedProduct.price).toFixed(0)}` : '₹299';

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-espresso border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-warm-taupe">Loading banner configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-warm-taupe/20 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-widest font-semibold text-warm-taupe">Content Management</span>
            <span className="text-warm-taupe/50">•</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30">
              Homepage Featured
            </span>
          </div>
          <h1 className="font-display text-2xl md:text-3xl text-espresso font-semibold">
            New Flavour Banner
          </h1>
          <p className="text-sm text-charcoal/70 mt-1">
            Configure the spotlight banner displayed directly below the Homepage Hero section.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadData}
            className="p-2.5 rounded-lg border border-warm-taupe/30 hover:bg-warm-taupe/10 text-charcoal transition-colors"
            title="Reload data"
          >
            <RefreshCw size={16} />
          </button>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="btn btn-primary text-xs inline-flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-ivory border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={15} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Form Controls Column (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-warm-taupe/20 p-6 md:p-8 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Status Switcher Card */}
            <div className="p-4 rounded-xl bg-cream/40 border border-warm-taupe/20 flex items-center justify-between">
              <div>
                <label className="text-sm font-semibold text-espresso block mb-0.5">Banner Status</label>
                <p className="text-xs text-charcoal/70">
                  {formData.status === 'active' 
                    ? 'Visible publicly on the homepage below the hero.' 
                    : 'Hidden from homepage. Section collapses cleanly.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, status: 'active' }))}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                    formData.status === 'active'
                      ? 'bg-pistachio text-espresso border border-pistachio shadow-xs'
                      : 'bg-white text-charcoal/60 border border-warm-taupe/30 hover:bg-cream'
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, status: 'inactive' }))}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                    formData.status === 'inactive'
                      ? 'bg-berry text-white border border-berry shadow-xs'
                      : 'bg-white text-charcoal/60 border border-warm-taupe/30 hover:bg-cream'
                  }`}
                >
                  Inactive
                </button>
              </div>
            </div>

            {/* Eyebrow Badge & Title */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-espresso mb-1.5">
                  Eyebrow Badge
                </label>
                <input
                  type="text"
                  name="badge"
                  value={formData.badge}
                  onChange={handleChange}
                  placeholder="NEW FLAVOUR"
                  className="w-full px-3.5 py-2.5 bg-white border border-warm-taupe/30 rounded-lg text-sm text-espresso focus:border-espresso focus:ring-1 focus:ring-espresso outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-espresso mb-1.5">
                  Banner Title <span className="text-berry">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Sicilian Pistachio Crunch"
                  className="w-full px-3.5 py-2.5 bg-white border border-warm-taupe/30 rounded-lg text-sm text-espresso focus:border-espresso focus:ring-1 focus:ring-espresso outline-none"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-espresso">
                  Short Description
                </label>
                <span className="text-[10px] text-warm-taupe">Keep concise for banner composition</span>
              </div>
              <textarea
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                placeholder="e.g. Slow-churned Bronte pistachio cream layered with roasted crushed nuts and sea salt crisp."
                className="w-full px-3.5 py-2.5 bg-white border border-warm-taupe/30 rounded-lg text-sm text-espresso focus:border-espresso focus:ring-1 focus:ring-espresso outline-none resize-none"
              />
            </div>

            {/* Product Selector & CTA Text */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-espresso mb-1.5">
                  Link to Catalog Product
                </label>
                <select
                  name="product_id"
                  value={formData.product_id}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-warm-taupe/30 rounded-lg text-sm text-espresso focus:border-espresso focus:ring-1 focus:ring-espresso outline-none"
                >
                  <option value="">-- No specific product (Links to /shop) --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.price ? `₹${parseFloat(p.price).toFixed(0)}` : 'Standard'})
                    </option>
                  ))}
                </select>
                {selectedProduct && (
                  <p className="text-[11px] text-warm-taupe mt-1">
                    Directs CTA to <code className="text-espresso font-mono">/product/{selectedProduct.slug}</code>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-espresso mb-1.5">
                  CTA Button Text
                </label>
                <input
                  type="text"
                  name="cta_text"
                  value={formData.cta_text}
                  onChange={handleChange}
                  placeholder="Discover Now"
                  className="w-full px-3.5 py-2.5 bg-white border border-warm-taupe/30 rounded-lg text-sm text-espresso focus:border-espresso focus:ring-1 focus:ring-espresso outline-none"
                />
              </div>
            </div>

            {/* Desktop Banner Image */}
            <div className="border-t border-warm-taupe/15 pt-5">
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-espresso">
                  Desktop Banner Image <span className="text-berry">*</span>
                </label>
                <span className="text-[10px] text-warm-taupe">Recommended: 1920×1080 (Landscape)</span>
              </div>
              
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  name="desktop_image"
                  required
                  value={formData.desktop_image}
                  onChange={handleChange}
                  placeholder="/images/signature-collection.jpg or image URL"
                  className="flex-1 px-3.5 py-2.5 bg-white border border-warm-taupe/30 rounded-lg text-sm text-espresso focus:border-espresso focus:ring-1 focus:ring-espresso outline-none font-mono text-xs"
                />
                <input
                  type="file"
                  ref={desktopFileInputRef}
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={(e) => handleFileUpload(e, 'desktop')}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={uploadingDesktop}
                  onClick={() => desktopFileInputRef.current?.click()}
                  className="px-3.5 py-2.5 rounded-lg border border-espresso/30 text-espresso hover:bg-espresso hover:text-ivory text-xs font-semibold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Upload size={13} />
                  {uploadingDesktop ? 'Uploading...' : 'Upload'}
                </button>
              </div>

              {/* Quick Preset Selector */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[11px] text-warm-taupe mr-1">Presets:</span>
                {presetImages.map(preset => (
                  <button
                    key={preset.url}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, desktop_image: preset.url }))}
                    className="text-[11px] px-2 py-0.5 rounded bg-cream border border-warm-taupe/20 text-charcoal hover:border-espresso transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Banner Image (Optional) */}
            <div className="border-t border-warm-taupe/15 pt-5">
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-espresso">
                  Mobile Banner Image <span className="text-warm-taupe/60 font-normal normal-case">(Optional)</span>
                </label>
                <span className="text-[10px] text-warm-taupe">Falls back to desktop image if left empty</span>
              </div>
              
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  name="mobile_image"
                  value={formData.mobile_image}
                  onChange={handleChange}
                  placeholder="/images/pistachio.jpg (Optional separate mobile crop)"
                  className="flex-1 px-3.5 py-2.5 bg-white border border-warm-taupe/30 rounded-lg text-sm text-espresso focus:border-espresso focus:ring-1 focus:ring-espresso outline-none font-mono text-xs"
                />
                <input
                  type="file"
                  ref={mobileFileInputRef}
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={(e) => handleFileUpload(e, 'mobile')}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={uploadingMobile}
                  onClick={() => mobileFileInputRef.current?.click()}
                  className="px-3.5 py-2.5 rounded-lg border border-espresso/30 text-espresso hover:bg-espresso hover:text-ivory text-xs font-semibold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Upload size={13} />
                  {uploadingMobile ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-warm-taupe/15 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary text-xs inline-flex items-center gap-2"
              >
                {saving ? 'Saving Changes...' : 'Save & Publish Banner'}
              </button>
            </div>

          </form>
        </div>

        {/* Live Preview Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-8">
          
          <div className="bg-white rounded-2xl border border-warm-taupe/20 p-5 shadow-xs">
            
            {/* Preview Toolbar */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-warm-taupe/15">
              <div className="flex items-center gap-2">
                <Eye size={16} className="text-espresso" />
                <span className="text-xs font-bold uppercase tracking-wider text-espresso">Live Preview</span>
              </div>

              <div className="flex items-center gap-1 bg-cream/70 p-1 rounded-lg border border-warm-taupe/20">
                <button
                  type="button"
                  onClick={() => setPreviewMode('desktop')}
                  className={`p-1.5 rounded-md text-xs transition-colors flex items-center gap-1.5 ${
                    previewMode === 'desktop'
                      ? 'bg-espresso text-ivory shadow-xs'
                      : 'text-charcoal/60 hover:text-espresso'
                  }`}
                  title="Desktop composition"
                >
                  <Monitor size={14} />
                  <span className="hidden sm:inline text-[11px] font-medium">Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('mobile')}
                  className={`p-1.5 rounded-md text-xs transition-colors flex items-center gap-1.5 ${
                    previewMode === 'mobile'
                      ? 'bg-espresso text-ivory shadow-xs'
                      : 'text-charcoal/60 hover:text-espresso'
                  }`}
                  title="Mobile composition"
                >
                  <Smartphone size={14} />
                  <span className="hidden sm:inline text-[11px] font-medium">Mobile</span>
                </button>
              </div>
            </div>

            {/* Rendered Preview Card */}
            <div className={`mx-auto transition-all duration-300 ${previewMode === 'mobile' ? 'max-w-[320px]' : 'w-full'}`}>
              <div className="relative rounded-xl overflow-hidden bg-espresso text-ivory shadow-md border border-warm-taupe/20">
                
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                  <img
                    src={previewMode === 'mobile' && formData.mobile_image ? previewMobileImg : previewDesktopImg}
                    alt={formData.title || 'Banner Preview'}
                    className="w-full h-full object-cover object-center"
                    onError={(e) => {
                      e.currentTarget.src = '/images/signature-collection.jpg';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-espresso/95 via-espresso/75 to-espresso/30" />
                  {previewMode === 'mobile' && (
                    <div className="absolute inset-0 bg-gradient-to-t from-espresso/90 via-transparent to-espresso/20" />
                  )}
                </div>

                {/* Content */}
                <div className={`relative z-10 flex flex-col justify-center ${
                  previewMode === 'mobile' ? 'p-5 min-h-[360px]' : 'p-6 min-h-[320px]'
                }`}>
                  
                  {formData.badge && (
                    <div className="inline-flex items-center gap-1.5 mb-2.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gold/25 backdrop-blur-md border border-gold/40 text-[9px] font-semibold uppercase tracking-[0.2em] text-gold">
                        <Sparkles size={10} className="shrink-0" />
                        {formData.badge}
                      </span>
                    </div>
                  )}

                  <h3 className={`font-display text-ivory font-normal leading-tight mb-2 tracking-tight ${
                    previewMode === 'mobile' ? 'text-2xl' : 'text-3xl'
                  }`}>
                    {formData.title || 'Flavour Title Here'}
                  </h3>

                  {formData.description && (
                    <p className={`text-ivory/80 font-light leading-relaxed mb-4 line-clamp-3 ${
                      previewMode === 'mobile' ? 'text-xs' : 'text-sm'
                    }`}>
                      {formData.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 pt-1">
                    {displayPrice && (
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase tracking-widest text-warm-taupe/80 font-medium">Starting from</span>
                        <span className="font-display text-lg sm:text-xl text-gold font-medium">{displayPrice}</span>
                      </div>
                    )}

                    <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-pill bg-ivory text-espresso font-medium text-[11px] uppercase tracking-[0.15em] shadow-sm pointer-events-none">
                      <span>{formData.cta_text || 'Discover Now'}</span>
                      <ArrowRight size={13} />
                    </div>
                  </div>

                </div>

              </div>
            </div>

            {/* Preview Information Note */}
            <div className="mt-4 p-3 rounded-lg bg-cream/30 border border-warm-taupe/15 text-[11px] text-charcoal/70 flex items-start gap-2">
              <CheckCircle2 size={14} className="text-pistachio shrink-0 mt-0.5" />
              <span>
                The preview reflects real-time changes. Click <strong>Save Changes</strong> above to publish directly to the live homepage.
              </span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default AdminBannerPage;
