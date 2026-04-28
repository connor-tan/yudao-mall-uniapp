<template>
  <s-layout :bgStyle="{ color: '#fff' }" tabbar="/pages/index/cart" title="购物车">
    <s-empty
      v-if="state.list.length === 0"
      icon="/static/cart-empty.png"
      text="购物车空空如也,快去逛逛吧~"
    />

    <!-- 头部 -->
    <view v-if="state.list.length" class="cart-box ss-flex ss-flex-col ss-row-between">
      <view class="cart-header ss-flex ss-col-center ss-row-between ss-p-x-30">
        <view class="header-left ss-flex ss-col-center ss-font-26">
          共
          <text class="goods-number ui-TC-Main ss-flex">{{ state.list.length }}</text>
          件商品
        </view>
        <view class="header-right">
          <button v-if="state.editMode" class="ss-reset-button" @tap="onChangeEditMode(false)">
            取消
          </button>
          <button v-else class="ss-reset-button ui-TC-Main" @tap="onChangeEditMode(true)">
            编辑
          </button>
        </view>
      </view>
      <!-- 内容 -->
      <view class="cart-content ss-flex-1 ss-p-x-30 ss-m-b-40">
        <view
          v-for="group in state.displayGroups"
          :key="group.groupKey"
          class="cart-group ss-m-b-20"
        >
          <view class="cart-group__header ss-flex ss-row-between ss-col-start ss-p-20">
            <view>
              <view class="cart-group__title">{{ groupTitle(group) }}</view>
              <view class="cart-group__meta" v-if="groupMeta(group)">
                {{ groupMeta(group) }}
              </view>
            </view>
            <view class="cart-group__count">{{ group.items?.length || 0 }} 件</view>
          </view>
          <view v-for="item in group.items" :key="item.id" class="goods-box ss-r-10 ss-m-b-14">
            <view class="ss-flex ss-col-center">
              <label
                class="check-box ss-flex ss-col-center ss-p-l-10"
                @tap="onSelectSingle(item.id)"
              >
                <radio
                  :checked="state.selectedIds.includes(item.id)"
                  color="var(--ui-BG-Main)"
                  style="transform: scale(0.8)"
                  @tap.stop="onSelectSingle(item.id)"
                />
              </label>
              <view v-if="group.invalid && !state.editMode" class="down-box"> 该商品已失效 </view>
              <view v-else-if="item.spu?.status !== 1 && !state.editMode" class="down-box">
                该商品已下架
              </view>
              <view v-else-if="item.spu?.stock <= 0 && !state.editMode" class="down-box">
                该商品无库存
              </view>
              <s-goods-item
                :img="itemImage(item)"
                :price="item.sku?.price"
                :skuText="formatSkuText(item)"
                :title="item.spu?.name"
                :titleWidth="400"
                priceColor="#FF3000"
              >
                <template v-if="!state.editMode && !group.invalid" v-slot:tool>
                  <su-number-box
                    v-model="item.count"
                    :max="item.sku?.stock || 0"
                    :min="0"
                    :step="1"
                    @change="onNumberChange($event, item)"
                  />
                </template>
              </s-goods-item>
            </view>
            <view v-if="item.subscriptionStudentId" class="publication-context ss-p-x-20 ss-p-b-16">
              订刊归属：{{ group.studentName || '-' }} / {{ group.schoolName || '-' }} /
              {{ group.gradeName || '-' }}
            </view>
          </view>
        </view>
      </view>
      <!-- 底部 -->
      <su-fixed v-if="state.list.length > 0" :isInset="false" :val="48" bottom placeholder>
        <view class="cart-footer ss-flex ss-col-center ss-row-between ss-p-x-30 border-bottom">
          <view class="footer-left ss-flex ss-col-center">
            <label class="check-box ss-flex ss-col-center ss-p-r-30" @tap="onSelectAll">
              <radio
                :checked="state.isAllSelected"
                color="var(--ui-BG-Main)"
                style="transform: scale(0.8)"
                @tap.stop="onSelectAll"
              />
              <view class="ss-m-l-8"> 全选</view>
            </label>
            <text>合计：</text>
            <view class="text-price price-text">
              {{ fen2yuan(state.totalPriceSelected) }}
            </view>
          </view>
          <view class="footer-right">
            <button
              v-if="state.editMode"
              class="ss-reset-button ui-BG-Main-Gradient pay-btn ui-Shadow-Main"
              @tap="onDelete"
            >
              删除
            </button>
            <button
              v-else
              class="ss-reset-button ui-BG-Main-Gradient pay-btn ui-Shadow-Main"
              @tap="onConfirm"
            >
              去结算
              {{ state.selectedIds?.length ? `(${state.selectedIds.length})` : '' }}
            </button>
          </view>
        </view>
      </su-fixed>
    </view>
  </s-layout>
</template>

<script setup>
  import sheep from '@/sheep';
  import { onShow } from '@dcloudio/uni-app';
  import { computed, reactive } from 'vue';
  import { fen2yuan } from '@/sheep/hooks/useGoods';
  import { isEmpty } from '@/sheep/helper/utils';
  import { resolveSingleDeliveryType } from '@/sheep/helper/delivery';

  // 隐藏原生tabBar
  uni.hideTabBar({
    fail: () => {},
  });

  const sys_navBar = sheep.$platform.navbar;
  const cart = sheep.$store('cart');

  const state = reactive({
    editMode: computed(() => cart.editMode),
    groups: computed(() => cart.groups),
    list: computed(() => cart.list),
    invalidList: computed(() => cart.invalidList),
    displayGroups: computed(() => buildDisplayGroups()),
    selectedList: [],
    selectedIds: computed(() => cart.selectedIds),
    isAllSelected: computed(() => cart.isAllSelected),
    totalPriceSelected: computed(() => cart.totalPriceSelected),
  });

  // 单选选中
  function onSelectSingle(id) {
    cart.selectSingle(id);
  }

  // 编辑、取消
  function onChangeEditMode(flag) {
    cart.onChangeEditMode(flag);
  }

  // 全选
  function onSelectAll() {
    cart.selectAll(!state.isAllSelected);
  }

  function buildDisplayGroups() {
    const groups = (cart.groups || [])
      .filter((group) => group.items?.length)
      .map((group, index) => ({
        ...group,
        groupKey: `${group.bizScene || 'NORMAL'}-${group.studentId || 'normal'}-${index}`,
      }));
    if (cart.invalidList?.length) {
      groups.push({
        groupKey: 'invalid',
        bizScene: 'INVALID',
        invalid: true,
        items: cart.invalidList,
      });
    }
    return groups;
  }

  function groupTitle(group) {
    if (group.invalid) {
      return '失效商品';
    }
    if (group.bizScene === 'PUBLICATION') {
      return `刊物商品：${group.studentName || '未知学生'}`;
    }
    return '普通商品';
  }

  function groupMeta(group) {
    if (group.invalid) {
      return '下架、库存不足或数据异常的商品仅支持删除';
    }
    if (group.bizScene !== 'PUBLICATION') {
      return '';
    }
    return [
      group.schoolName,
      group.className || group.gradeName,
      group.stationName ? `站点：${group.stationName}` : '',
    ]
      .filter(Boolean)
      .join('｜');
  }

  function itemImage(item) {
    return item.spu?.picUrl || item.goods?.image;
  }

  function formatSkuText(item) {
    const properties = item.sku?.properties || [];
    if (!properties.length) {
      return '';
    }
    return properties
      .map((property) => property.valueName)
      .filter(Boolean)
      .join(' ');
  }

  function resolveCartItemDeliveryType(item) {
    if (!item.subscriptionStudentId) {
      return undefined;
    }
    return resolveSingleDeliveryType(item.spu?.deliveryTypes);
  }

  function findGroupByItemId(itemId) {
    return state.displayGroups.find((group) =>
      (group.items || []).some((item) => item.id === itemId),
    );
  }

  // 结算
  async function onConfirm() {
    const items = [];
    state.selectedList = state.list.filter((item) => state.selectedIds.includes(item.id));
    state.selectedList.map((item) => {
      const group = findGroupByItemId(item.id) || {};
      items.push({
        skuId: item.sku.id,
        count: item.count,
        cartId: item.id,
        spuId: item.spu?.id,
        categoryId: item.spu.categoryId,
        bizScene: group.bizScene,
        deliveryTypes: item.spu?.deliveryTypes,
        studentId: item.subscriptionStudentId,
        studentName: group.studentName,
        schoolName: group.schoolName,
        className: group.className,
        gradeName: group.gradeName,
        offerSkuId: item.subscriptionOfferSkuId,
        deliveryType: resolveCartItemDeliveryType(item),
      });
    });
    if (isEmpty(items)) {
      sheep.$helper.toast('请先选择商品');
      return;
    }
    sheep.$router.go('/pages/order/confirm', {
      data: JSON.stringify({
        items,
      }),
    });
  }

  function onNumberChange(e, cartItem) {
    if (e === 0) {
      cart.delete(cartItem.id);
      return;
    }
    if (cartItem.goods_num === e) return;
    cartItem.goods_num = e;
    cart.update({
      goods_id: cartItem.id,
      goods_num: e,
      goods_sku_price_id: cartItem.goods_sku_price_id,
    });
  }

  async function onDelete() {
    cart.delete(state.selectedIds);
  }

  function getCartList() {
    cart.getList();
  }

  onShow(() => {
    getCartList();
  });
</script>

<style lang="scss" scoped>
  :deep(.ui-fixed) {
    height: 72rpx;
  }

  .cart-box {
    width: 100%;

    .cart-header {
      height: 70rpx;
      background-color: #f6f6f6;
      width: 100%;
      position: fixed;
      left: 0;
      top: v-bind('sys_navBar') rpx;
      z-index: 1000;
      box-sizing: border-box;
    }

    .cart-footer {
      height: 100rpx;
      background-color: #fff;

      .pay-btn {
        width: 180rpx;
        height: 70rpx;
        font-size: 28rpx;
        line-height: 28rpx;
        font-weight: 500;
        border-radius: 40rpx;
      }
    }

    .cart-content {
      margin-top: 70rpx;

      .cart-group {
        background-color: #f7f8fa;
        border-radius: 16rpx;
        overflow: hidden;
      }

      .cart-group__header {
        background-color: #fff;
        border-bottom: 1rpx solid #f2f2f2;
      }

      .cart-group__title {
        font-size: 28rpx;
        font-weight: 600;
        color: #333;
      }

      .cart-group__meta {
        margin-top: 8rpx;
        font-size: 24rpx;
        color: #888;
        line-height: 34rpx;
      }

      .cart-group__count {
        font-size: 24rpx;
        color: #999;
      }

      .goods-box {
        background-color: #fff;
        position: relative;
      }

      .publication-context {
        font-size: 24rpx;
        color: #888;
        line-height: 34rpx;
      }
      // 下架商品
      .down-box {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background: rgba(#fff, 0.8);
        z-index: 2;
        display: flex;
        justify-content: center;
        align-items: center;
        color: #999;
        font-size: 32rpx;
      }
    }
  }
</style>
