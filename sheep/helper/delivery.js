import { DeliveryTypeEnum } from '@/sheep/helper/const';

export const PUBLICATION_BIZ_SCENE = 'PUBLICATION';

const ATOMIC_DELIVERY_TYPES = [
  DeliveryTypeEnum.EXPRESS.type,
  DeliveryTypeEnum.PICK_UP.type,
  DeliveryTypeEnum.STATION.type,
];

export function normalizeDeliveryTypes(deliveryTypes) {
  return Array.from(
    new Set(
      (deliveryTypes || [])
        .map((deliveryType) => Number(deliveryType))
        .filter((deliveryType) => ATOMIC_DELIVERY_TYPES.includes(deliveryType)),
    ),
  );
}

export function resolveSingleDeliveryType(deliveryTypes) {
  const normalized = normalizeDeliveryTypes(deliveryTypes);
  return normalized.length === 1 ? normalized[0] : undefined;
}

export function isPublicationOrderItem(item) {
  return item?.bizScene === PUBLICATION_BIZ_SCENE || Boolean(item?.studentId && item?.offerSkuId);
}

export function getSupportedDeliveryTypes(item, pickUpEnabled = true) {
  const deliveryTypes = normalizeDeliveryTypes(item?.deliveryTypes);
  if (isPublicationOrderItem(item)) {
    return deliveryTypes.filter(
      (deliveryType) =>
        deliveryType === DeliveryTypeEnum.EXPRESS.type ||
        deliveryType === DeliveryTypeEnum.STATION.type,
    );
  }
  return deliveryTypes.filter(
    (deliveryType) =>
      deliveryType === DeliveryTypeEnum.EXPRESS.type ||
      (pickUpEnabled && deliveryType === DeliveryTypeEnum.PICK_UP.type),
  );
}

export function resolveDefaultDeliveryType(item, pickUpEnabled = true) {
  const supportedDeliveryTypes = getSupportedDeliveryTypes(item, pickUpEnabled);
  if (item?.deliveryType && supportedDeliveryTypes.includes(item.deliveryType)) {
    return item.deliveryType;
  }
  if (supportedDeliveryTypes.length === 1) {
    return supportedDeliveryTypes[0];
  }
  if (
    isPublicationOrderItem(item) &&
    supportedDeliveryTypes.includes(DeliveryTypeEnum.STATION.type)
  ) {
    return DeliveryTypeEnum.STATION.type;
  }
  if (supportedDeliveryTypes.includes(DeliveryTypeEnum.EXPRESS.type)) {
    return DeliveryTypeEnum.EXPRESS.type;
  }
  return supportedDeliveryTypes[0];
}

export function formatDeliveryTypeName(deliveryType) {
  if (deliveryType === DeliveryTypeEnum.EXPRESS.type) {
    return '快递发货';
  }
  if (deliveryType === DeliveryTypeEnum.PICK_UP.type) {
    return '用户自提';
  }
  if (deliveryType === DeliveryTypeEnum.STATION.type) {
    return '站点配送';
  }
  return '未知配送';
}
