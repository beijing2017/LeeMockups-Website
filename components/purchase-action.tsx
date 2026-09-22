import { PaddleCheckoutButton } from "@/components/paddle-checkout-button";
import { CreemCheckoutButton } from "@/components/creem-checkout-button";

type PurchaseActionProps={
  provider:string;
  sku:string;
  providerProductId?:string;
  purchaseUrl?:string;
};

export function PurchaseAction({provider,sku,providerProductId,purchaseUrl}:PurchaseActionProps){
  const normalized=provider.toUpperCase();
  if(normalized==="PADDLE"&&providerProductId)return <PaddleCheckoutButton priceId={providerProductId} sku={sku}/>;
  if(normalized==="CREEM"&&providerProductId)return <CreemCheckoutButton productId={providerProductId} sku={sku}/>;
  if(purchaseUrl)return <a className="button primary purchase-primary" href={purchaseUrl} target="_blank" rel="noreferrer">Buy now</a>;
  return <button className="button primary purchase-primary" disabled>Coming Soon</button>;
}
