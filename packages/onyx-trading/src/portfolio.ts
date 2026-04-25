/**
 * Portfolio state tracking
 * In-memory store — production would use a DB
 */

import { Portfolio, CompletedTrade } from './types.js';

let state: Portfolio = {
  totalValueUsd: 10000,
  positions: {},
  cashUsd: 10000,
  timestamp: Date.now(),
};

const tradeHistory: CompletedTrade[] = [];

export function getPortfolio(): Portfolio {
  return { ...state };
}

export function setStartingCapital(usd: number): void {
  state = {
    totalValueUsd: usd,
    positions: {},
    cashUsd: usd,
    timestamp: Date.now(),
  };
}

export function recordBuy(token: string, amountUsd: number, price: number): void {
  const existing = state.positions[token];
  if (existing) {
    const totalValue = existing.valueUsd + amountUsd;
    const totalAmount = existing.amount + amountUsd / price;
    state.positions[token] = {
      amount: totalAmount,
      valueUsd: totalValue,
      entryPrice: totalValue / totalAmount,
    };
  } else {
    state.positions[token] = {
      amount: amountUsd / price,
      valueUsd: amountUsd,
      entryPrice: price,
    };
  }
  state.cashUsd -= amountUsd;
  state.timestamp = Date.now();
  recalcTotal();
}

export function recordSell(token: string, amountUsd: number, price: number): void {
  const pos = state.positions[token];
  if (!pos) return;

  pos.amount -= amountUsd / price;
  pos.valueUsd = pos.amount * pos.entryPrice;

  if (pos.amount <= 0) {
    delete state.positions[token];
  }

  state.cashUsd += amountUsd;
  state.timestamp = Date.now();
  recalcTotal();
}

export function updatePositionPrice(token: string, price: number): void {
  const pos = state.positions[token];
  if (!pos) return;
  pos.valueUsd = pos.amount * price;
  recalcTotal();
}

function recalcTotal(): void {
  const posValue = Object.values(state.positions).reduce((s, p) => s + p.valueUsd, 0);
  state.totalValueUsd = state.cashUsd + posValue;
}

export function addTrade(trade: CompletedTrade): void {
  tradeHistory.push(trade);
}

export function getTradeHistory(): CompletedTrade[] {
  return [...tradeHistory];
}

export function getLastNTrades(n: number): CompletedTrade[] {
  return tradeHistory.slice(-n);
}