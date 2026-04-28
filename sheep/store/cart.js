import { defineStore } from 'pinia';
import CartApi from '@/sheep/api/trade/cart';

const cart = defineStore({
  id: 'cart',
  state: () => ({
    groups: [], // 购物车分组（普通商品 / 学生刊物）
    list: [], // 购物车列表（invalidList + validList）
    invalidList: [], // 失效购物项
    selectedIds: [], // 已选列表
    isAllSelected: false, // 是否全选
    totalPriceSelected: 0, // 选中项总金额
    newList: [], // 除去已下架的购物车列表（validList）
    editMode: false, // 是否是编辑模式
  }),
  actions: {
    // 获取购物车列表
    async getList() {
      const { data, code } = await CartApi.getCartList();
      if (code === 0) {
        const validList = data.validList || [];
        const invalidList = data.invalidList || [];
        this.groups = data.groups || [];
        this.list = [...validList, ...invalidList];
        this.newList = validList;
        this.invalidList = invalidList;

        // 计算各种关联属性
        this.selectedIds = [];
        const selectableList = this.editMode ? this.list : this.newList;
        this.isAllSelected = selectableList.length > 0;
        this.totalPriceSelected = 0;
        selectableList.forEach((item) => {
          if (item.selected) {
            this.selectedIds.push(item.id);
            this.totalPriceSelected += item.count * item.sku?.price;
          } else {
            this.isAllSelected = false;
          }
        });
      }
    },

    onChangeEditMode(flag) {
      this.editMode = flag;
      this.selectedIds = [];
      this.getList();
    },

    // 添加购物车
    async add(goodsInfo) {
      // 添加购物项
      const { code } = await CartApi.addCart({
        skuId: goodsInfo.id,
        count: goodsInfo.goods_num,
        studentId: goodsInfo.studentId,
        offerSkuId: goodsInfo.offerSkuId,
      });
      // 刷新购物车列表
      if (code === 0) {
        await this.getList();
      }
    },

    // 更新购物车
    async update(goodsInfo) {
      const { code } = await CartApi.updateCartCount({
        id: goodsInfo.goods_id,
        count: goodsInfo.goods_num,
      });
      if (code === 0) {
        await this.getList();
      }
    },

    // 移除购物车
    async delete(ids) {
      let idsTemp = '';
      if (Array.isArray(ids)) {
        idsTemp = ids.join(',');
      } else {
        idsTemp = ids;
      }
      const { code } = await CartApi.deleteCart(idsTemp);
      if (code === 0) {
        await this.getList();
      }
    },

    // 单选购物车商品
    async selectSingle(goodsId) {
      const { code } = await CartApi.updateCartSelected({
        ids: [goodsId],
        selected: !this.selectedIds.includes(goodsId), // 取反
      });
      if (code === 0) {
        await this.getList();
      }
    },

    // 全选购物车商品
    async selectAll(flag) {
      const selectableList = this.editMode ? this.list : this.newList;
      const { code } = await CartApi.updateCartSelected({
        ids: selectableList.map((item) => item.id),
        selected: flag,
      });
      if (code === 0) {
        await this.getList();
      }
    },

    // 清空购物车。注意，仅用于用户退出时，重置数据
    emptyList() {
      this.groups = [];
      this.list = [];
      this.invalidList = [];
      this.newList = [];
      this.selectedIds = [];
      this.isAllSelected = true;
      this.totalPriceSelected = 0;
    },
  },
  persist: {
    enabled: true,
    strategies: [
      {
        key: 'cart-store',
      },
    ],
  },
});

export default cart;
