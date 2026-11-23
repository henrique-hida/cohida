import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useCommerce } from '@/data/useCommerce';
import { useCategories } from '@/data/useCategories';

export function useAdminProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { state, loadAdminProducts, setProductStatus } = useCommerce();
  const categories = useCategories();
  const [error, setError] = useState('');

  useEffect(() => {
    void loadAdminProducts().catch((cause: Error) => setError(cause.message));
  }, [loadAdminProducts]);

  const product = state.products.find((item) => item.id === productId);

  async function deactivate() {
    if (!product) return;
    try {
      await setProductStatus(product.id, 'inactive');
      navigate('/admin/produtos');
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Não foi possível desativar.',
      );
    }
  }

  return { product, error, deactivate, categories };
}
