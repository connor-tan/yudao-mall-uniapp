import request from '@/sheep/request';

const SubscriptionPublicationApi = {
  listVisibleOffers(studentId, productSpuIds) {
    const params = { studentId };
    if (Array.isArray(productSpuIds) && productSpuIds.length) {
      params.productSpuIds = productSpuIds.join(',');
    } else if (productSpuIds) {
      params.productSpuIds = productSpuIds;
    }
    return request({
      url: '/subscription/app/publication/list',
      method: 'GET',
      params,
      custom: {
        showLoading: false,
        showError: false,
      },
    });
  },
  async getVisibleOffer(studentId, productSpuId) {
    const response = await this.listVisibleOffers(studentId, [productSpuId]);
    if (!response || response.code !== 0) {
      return response;
    }
    return {
      ...response,
      data:
        (response.data?.offers || []).find((item) => item.productSpuId === Number(productSpuId)) ||
        null,
    };
  },
};

export default SubscriptionPublicationApi;
