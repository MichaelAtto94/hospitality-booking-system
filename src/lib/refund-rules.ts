export function refundableBalance(paymentAmount: number, committedRefunds: number) {
  return Math.max(0, Math.round((paymentAmount - committedRefunds) * 100) / 100);
}

export function isFullRefund(paymentAmount: number, approvedRefunds: number) {
  return approvedRefunds >= paymentAmount - 0.001;
}
