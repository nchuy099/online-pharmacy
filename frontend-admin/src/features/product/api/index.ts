import axios from '../../../shared/services/axios';
import { ApiResponse } from '../../../shared/types';
import {
    ProductPageResponseDto,
    ProductDetailsResponseDto,
    CreateProductRequestDto,
    UpdateProductRequestDto,
    UpdateProductCategoriesRequestDto,
    ProductImageUploadUrlRespDto,
    ProductCatalogOptionsDto,
    ProductDetailsVariantResponseDto,
    CreateProductVariantRequestDto,
    UpdateProductVariantRequestDto,
} from '../types/dto';

const productApi = {
    async getList(page: number = 1, size: number = 10, search?: string, categorySlug?: string, minPrice?: number, maxPrice?: number): Promise<ApiResponse<ProductPageResponseDto>> {
        try {
            const res = await axios.get('/admin/products/list', {
                params: { page, size, search, categorySlug, minPrice, maxPrice },
            });
            return res.data;
        } catch (error) {
            console.log('Get products error: ', error);
            throw error;
        }
    },

    async createImageUploadUrl(): Promise<ApiResponse<ProductImageUploadUrlRespDto>> {
        const res = await axios.post('/admin/products/images/upload-url/create');
        return res.data;
    },

    async create(payload: CreateProductRequestDto): Promise<ApiResponse<ProductDetailsResponseDto>> {
        try {
            const res = await axios.post('/admin/products/create', payload);
            return res.data;
        } catch (error) {
            console.log('Create product error: ', error);
            throw error;
        }
    },

    async update(id: string | undefined, payload: UpdateProductRequestDto): Promise<ApiResponse<ProductDetailsResponseDto>> {
        try {
            const res = await axios.put('/admin/products/' + id + '/update', payload);
            return res.data;
        } catch (error) {
            console.log('Update product error: ', error);
            throw error;
        }
    },

    async updateCategories(id: string, payload: UpdateProductCategoriesRequestDto): Promise<ApiResponse<ProductDetailsResponseDto>> {
        const res = await axios.put('/admin/products/' + id + '/categories', payload);
        return res.data;
    },

    async remove(productId: string | undefined): Promise<ApiResponse> {
        try {
            const res = await axios.delete('/admin/products/' + productId + '/delete');
            return res.data;
        } catch (error) {
            console.log('Delete product error: ', error);
            throw error;
        }
    },

    async getDetails(productId: string | undefined): Promise<ApiResponse<ProductDetailsResponseDto>> {
        try {
            const res = await axios.get('/admin/products/' + productId + '/details');
            return res.data;
        } catch (error) {
            console.log('Get product details error: ', error);
            throw error;
        }
    },

    async getCatalogOptions(): Promise<ApiResponse<ProductCatalogOptionsDto>> {
        try {
            const res = await axios.get('/admin/catalogs/product-options');
            return res.data;
        } catch (error) {
            console.log('Get product catalog options error: ', error);
            throw error;
        }
    },

    async getVariants(productId: string): Promise<ApiResponse<ProductDetailsVariantResponseDto[]>> {
        const res = await axios.get(`/admin/products/${productId}/variants`);
        return res.data;
    },

    async createVariant(productId: string, payload: CreateProductVariantRequestDto): Promise<ApiResponse<ProductDetailsVariantResponseDto>> {
        const res = await axios.post(`/admin/products/${productId}/variants/create`, payload);
        return res.data;
    },

    async updateVariant(productId: string, variantId: string, payload: UpdateProductVariantRequestDto): Promise<ApiResponse<ProductDetailsVariantResponseDto>> {
        const res = await axios.put(`/admin/products/${productId}/variants/${variantId}/update`, payload);
        return res.data;
    },

    async deleteVariant(productId: string, variantId: string): Promise<ApiResponse<void>> {
        const res = await axios.delete(`/admin/products/${productId}/variants/${variantId}/delete`);
        return res.data;
    },
};

export default productApi;
