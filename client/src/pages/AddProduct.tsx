import { useEffect, useState } from 'react';
import { createProduct, getRefs, listProducts, uploadImages } from '../lib/api';
import { NeonCard, NeonButton, NeonInput, NeonSelect, NeonTextarea } from '../components/Neon';

export default function AddProduct() {
  const [refs, setRefs] = useState<{ companies: any[]; categories: any[]; subcategories: any[] }>({ companies: [], categories: [], subcategories: [] });
  const [form, setForm] = useState<any>({ pname: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    getRefs().then(setRefs);
    listProducts().then(setProducts);
  }, []);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    if (files.length > 4) {
      alert('Maximum 4 images allowed');
      return;
    }
    
    setUploading(true);
    try {
      const result = await uploadImages(files);
      setUploadedImages(result.images);
      
      // Update form with image URLs
      const imageFields = ['img', 'imgb', 'imgc', 'imgd'];
      const newForm = { ...form };
      result.images.forEach((url: string, index: number) => {
        if (index < imageFields.length) {
          newForm[imageFields[index]] = url;
        }
      });
      setForm(newForm);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Image upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    try {
      const body = { ...form };
      console.log('Submitting product data:', body);
      
      // cast numeric fields
      ['company_id','cat_id','subcat_id','sprice','pprice','quantity'].forEach((k) => {
        if (body[k] && body[k] !== '') {
          body[k] = Number(body[k]);
        } else if (body[k] === '') {
          delete body[k]; // Remove empty strings
        }
      });
      
      const result = await createProduct(body);
      console.log('Product created successfully:', result);
      setSuccess('Product created successfully!');
      setForm({ pname: '' });
      setUploadedImages([]);
      const list = await listProducts(q);
      setProducts(list);
    } catch (error) {
      console.error('Error creating product:', error);
      setSuccess('Error creating product: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  }

  async function search() {
    const list = await listProducts(q);
    setProducts(list);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold neon-glow">Add New Product</h1>
      <NeonCard className="p-4">
      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NeonSelect value={form.company_id || ''} onChange={(e) => setForm({ ...form, company_id: e.target.value })}>
          <option value="">Select Company</option>
          {refs.companies.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
        </NeonSelect>
        <NeonSelect value={form.cat_id || ''} onChange={(e) => setForm({ ...form, cat_id: e.target.value })}>
          <option value="">Select Category</option>
          {refs.categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
        </NeonSelect>
        <NeonSelect value={form.subcat_id || ''} onChange={(e) => setForm({ ...form, subcat_id: e.target.value })}>
          <option value="">Select Subcategory</option>
          {refs.subcategories.filter(sc => !form.cat_id || sc.cat_id === Number(form.cat_id)).map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
        </NeonSelect>
        <NeonInput placeholder="Product Name" value={form.pname} onChange={(e) => setForm({ ...form, pname: e.target.value })} required />
        <NeonInput placeholder="Product Size" value={form.quantity || ''} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
        <NeonInput placeholder="Sale Price" type="number" step="0.01" value={form.sprice || ''} onChange={(e) => setForm({ ...form, sprice: e.target.value })} />
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-white mb-2">
            Upload Images (Max 4)
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="block w-full text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-700 file:cursor-pointer bg-transparent border border-green-500 rounded-lg p-2"
            disabled={uploading}
          />
          {uploading && <p className="text-blue-400 mt-1">Uploading images...</p>}
          {uploadedImages.length > 0 && (
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
              {uploadedImages.map((url, index) => (
                <div key={index} className="relative">
                  <img
                    src={url}
                    alt={`Uploaded ${index + 1}`}
                    className="w-full h-20 object-cover rounded-lg border border-green-500"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        <NeonTextarea className="md:col-span-2" placeholder="Detail" value={form.detail || ''} onChange={(e) => setForm({ ...form, detail: e.target.value })} />
        <div className="md:col-span-2 flex gap-3">
          <NeonButton disabled={loading}>{loading ? 'Saving…' : 'Save Product'}</NeonButton>
          {success && <span className="text-green-400">{success}</span>}
        </div>
      </form>
      </NeonCard>

      <NeonCard className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <NeonInput placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
          <NeonButton onClick={search}>Search</NeonButton>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          {products.map((p) => (
            <NeonCard key={p.id} className="p-3">
              <div className="flex items-start gap-3">
                <div className="flex flex-col">
                  {p.img && <img src={p.img} className="h-14 w-14 rounded-lg object-cover shadow" />}
                  {p.imgb && <img src={p.imgb} className="h-14 w-14 rounded-lg object-cover shadow -mt-1" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-white truncate" title={p.pname}>{p.pname}</div>
                  <div className="text-sm text-white/70 mt-1">Price: {p.sprice ?? '-'}</div>
                  {p.company_name && (
                    <div className="text-xs text-green-400 mt-1">Company: {p.company_name}</div>
                  )}
                  {p.subcategory_name && (
                    <div className="text-xs text-blue-400 mt-1">Category: {p.subcategory_name}</div>
                  )}
                </div>
              </div>
            </NeonCard>
          ))}
        </div>
      </NeonCard>
    </div>
  );
}


