import request from '@/sheep/request';

const SubscriptionPublicationApi = {
  getPublication(studentId, productSpuId) {
    return request({
      url: '/subscription/publication/get',
      method: 'GET',
      params: {
        studentId,
        productSpuId,
      },
      custom: {
        showLoading: false,
        showError: false,
      },
    });
  },
  getPublicationListBySpuIds(studentId, productSpuIds) {
    return request({
      url: '/subscription/publication/list-by-spu-ids',
      method: 'GET',
      params: {
        studentId,
        productSpuIds,
      },
      custom: {
        showLoading: false,
        showError: false,
      },
    });
  },
};

export default SubscriptionPublicationApi;
