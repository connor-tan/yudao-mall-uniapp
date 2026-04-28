<!-- 装修商品组件：商品栏 -->
<template>
  <view>
    <!-- 布局1. 两列商品，图片左文案右 -->
    <view
      v-if="layoutType === 'twoCol'"
      class="goods-xs-box ss-flex ss-flex-wrap"
      :style="[{ margin: '-' + data.space + 'rpx' }]"
    >
      <view
        class="goods-xs-list"
        v-for="item in goodsList"
        :key="item.id"
        :style="[
          {
            padding: data.space + 'rpx',
          },
        ]"
      >
        <s-goods-column
          class="goods-card"
          size="xs"
          :goodsFields="data.fields"
          :tagStyle="data.badge"
          :data="item"
          :titleColor="data.fields.name?.color"
          :topRadius="data.borderRadiusTop"
          :bottomRadius="data.borderRadiusBottom"
          :titleWidth="(454 - marginRight * 2 - data.space * 2 - marginLeft * 2) / 2"
          @click="goGoodsDetail(item)"
        />
      </view>
    </view>
    <!-- 布局. 三列商品：图片上文案下 -->
    <view
      v-if="layoutType === 'threeCol'"
      class="goods-sm-box ss-flex ss-flex-wrap"
      :style="[{ margin: '-' + data.space + 'rpx' }]"
    >
      <view
        v-for="item in goodsList"
        :key="item.id"
        class="goods-card-box"
        :style="[
          {
            padding: data.space + 'rpx',
          },
        ]"
      >
        <s-goods-column
          class="goods-card"
          size="sm"
          :goodsFields="data.fields"
          :tagStyle="data.badge"
          :data="item"
          :titleColor="data.fields.name?.color"
          :topRadius="data.borderRadiusTop"
          :bottomRadius="data.borderRadiusBottom"
          @click="goGoodsDetail(item)"
        />
      </view>
    </view>

    <!-- 布局3. 一行商品，水平滑动 -->
    <view v-if="layoutType === 'horizSwiper'" class="">
      <scroll-view class="scroll-box goods-scroll-box" scroll-x scroll-anchoring>
        <view class="goods-box ss-flex">
          <view
            class="goods-card-box"
            v-for="item in goodsList"
            :key="item.id"
            :style="[{ marginRight: data.space * 2 + 'rpx' }]"
          >
            <s-goods-column
              class="goods-card"
              size="sm"
              :goodsFields="data.fields"
              :tagStyle="data.badge"
              :data="item"
              :titleColor="data.fields.name?.color"
              :titleWidth="(750 - marginRight * 2 - data.space * 4 - marginLeft * 2) / 3"
              @click="goGoodsDetail(item)"
            />
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
  /**
   * 商品栏
   */
  import { ref, computed, watch } from 'vue';
  import sheep from '@/sheep';
  import SpuApi from '@/sheep/api/product/spu';
  import SubscriptionPublicationApi from '@/sheep/api/subscription/publication';

  const PUBLICATION_DOMAIN_TYPE = 'PUBLICATION';
  const studentStore = sheep.$store('student');

  const props = defineProps({
    data: {
      type: Object,
      default() {},
    },
    styles: {
      type: Object,
      default() {},
    },
  });
  const layoutType = computed(() => props.data?.layoutType);
  const spuIds = computed(() => props.data?.spuIds || []);
  const marginLeft = computed(() => props.styles?.marginLeft || 0);
  const marginRight = computed(() => props.styles?.marginRight || 0);
  const goodsList = ref([]);

  async function filterVisibleGoods(list) {
    if (!list.length) {
      return [];
    }
    const normalGoods = list.filter((item) => item.domainType !== PUBLICATION_DOMAIN_TYPE);
    const publicationGoods = list.filter((item) => item.domainType === PUBLICATION_DOMAIN_TYPE);
    if (!publicationGoods.length) {
      return list;
    }
    if (!studentStore.currentStudentId) {
      return normalGoods;
    }
    const response = await SubscriptionPublicationApi.getPublicationListBySpuIds(
      studentStore.currentStudentId,
      publicationGoods.map((item) => item.id).join(','),
    );
    if (!response) {
      return normalGoods;
    }
    const { code, data } = response;
    if (code !== 0) {
      return normalGoods;
    }
    const visiblePublicationIdSet = new Set((data || []).map((item) => item.productSpuId));
    return list.filter(
      (item) => item.domainType !== PUBLICATION_DOMAIN_TYPE || visiblePublicationIdSet.has(item.id),
    );
  }

  async function loadGoodsList() {
    goodsList.value = [];
    if (!spuIds.value.length) {
      return;
    }
    const { data } = await SpuApi.getSpuListByIds(spuIds.value.join(','));
    goodsList.value = await filterVisibleGoods(data || []);
  }

  function goGoodsDetail(item) {
    const params = {
      id: item.id,
    };
    if (item.domainType === PUBLICATION_DOMAIN_TYPE && studentStore.currentStudentId) {
      params.studentId = studentStore.currentStudentId;
    }
    sheep.$router.go('/pages/goods/index', params);
  }

  watch(
    [() => spuIds.value.join(','), () => studentStore.visibilityVersion],
    () => {
      loadGoodsList();
    },
    {
      immediate: true,
    },
  );
</script>

<style lang="scss" scoped>
  .goods-xs-box {
    // margin: 0 auto;
    width: 100%;
    .goods-xs-list {
      box-sizing: border-box;
      flex-shrink: 0;
      overflow: hidden;
      width: 50%;
    }
  }

  .goods-sm-box {
    margin: 0 auto;
    box-sizing: border-box;
    .goods-card-box {
      flex-shrink: 0;
      overflow: hidden;
      width: 33.3%;
      box-sizing: border-box;
    }
  }
  .goods-scroll-box {
    margin: 0 auto;
    width: 100%;
    box-sizing: border-box;
  }
</style>
