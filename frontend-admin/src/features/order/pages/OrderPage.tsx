import { OrderHeader, OrderTable } from '../components';
import { useOrderList } from '../hooks/useOrder';
import { Pagination, SearchFilter, FilterConfig } from '../../../shared/components/ui';

const OrderPage = () => {
    const {
        orders,
        isLoading,
        error,
        refresh,
        pagination,
        search,
        setSearch,
        status,
        setStatus
    } = useOrderList();

    const handlePageChange = (newPage: number) => {
        refresh(newPage, pagination.size, search, status);
    };

    const filters: FilterConfig[] = [
        {
            key: 'status',
            label: 'Tất cả trạng thái',
            value: status,
            onChange: setStatus,
            options: [
                { label: 'Chờ xác nhận', value: 'PENDING' },
                { label: 'Chờ thanh toán', value: 'PENDING_PAYMENT' },
                { label: 'Đang xử lý', value: 'PROCESSING' },
                { label: 'Đang giao', value: 'SHIPPING' },
                { label: 'Đã giao', value: 'DELIVERED' },
                { label: 'Yêu cầu trả hàng', value: 'RETURN_REQUESTED' },
                { label: 'Đã trả hàng', value: 'RETURNED' },
                { label: 'Đã hủy', value: 'CANCELLED' },
            ]
        }
    ];

    return (
        <div className="space-y-6">
            <OrderHeader />

            <SearchFilter
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder="Tìm kiếm đơn hàng theo mã đơn (Order Code)..."
                filters={filters}
                onClear={() => {
                    setSearch('');
                    setStatus('all');
                }}
                accentColor="amber"
            />

            {error ? (
                <div className="text-red-600 p-8 text-center bg-red-50 rounded-xl border border-red-100">{error.message}</div>
            ) : (
                <>
                    <OrderTable orders={orders} isLoading={isLoading} />
                    {!isLoading && (
                        <Pagination
                            currentPage={pagination.page}
                            totalPages={pagination.totalPages}
                            totalElements={pagination.totalElements}
                            pageSize={pagination.size}
                            onPageChange={handlePageChange}
                        />
                    )}
                </>
            )}

        </div>
    );
};

export default OrderPage;
