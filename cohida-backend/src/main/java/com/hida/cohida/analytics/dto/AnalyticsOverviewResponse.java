package com.hida.cohida.analytics.dto;

public record AnalyticsOverviewResponse(long revenueCents, long orders, long averageTicketCents, long discountsCents,
                                        long returns) {
}
