import request from '@/sheep/request';

const StudentApi = {
  getMySimpleList: () => {
    return request({
      url: '/edu/student/my-simple-list',
      method: 'GET',
      custom: {
        showLoading: false,
      },
    });
  },
};

export default StudentApi;
