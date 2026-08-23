# CoHida Screen Inventory

This document translates the sports-equipment e-commerce requirements in
[`AGENTS.md`](../AGENTS.md) into a practical screen inventory. It separates
customer-facing flows from the authenticated administration area.

## Public and customer screens

### 1. Home

- Hero, sports-category navigation, featured products, promotions, personalized
  recommendations, chatbot entry, newsletter, and footer.

### 2. Product catalog and search

- Search plus filters for category, brand, price, size, color, material, model,
  availability, and ordering.
- Pagination and a clear representation of applied filters.

### 3. Product details

- Images, product code/barcode, description, dimensions, attributes, price,
  stock state, related items, and add-to-cart action.
- The action must respect available stock.

### 4. Chatbot and product discovery

- Conversational product search, product questions, recommendation cards, and
  relevant-content suggestions.
- Customer data must be minimized and no secrets exposed to an AI provider.

### 5. Cart

- Cart items, quantity editing, removal, subtotal, reservation countdown, and
  five-minute reservation-expiry warning.
- Expired items must be clear, and checkout remains disabled until they are
  added again.

### 6. Checkout: delivery

- Select a saved delivery address or enter a new one.
- Optionally save the new address and display calculated freight.

### 7. Checkout: payment and coupons

- Saved/new card selection, optional card saving, split payments,
  exchange/promotional coupons, and order summary.
- Surface the one-promotional-coupon rule and the R$ 10,00 minimum per card for
  split payments.

### 8. Checkout: review and confirmation

- Revalidate stock, show final totals, submit the order, and explain items
  adjusted or removed because availability changed.

### 9. Order result

- Processing, approved, or rejected outcome, with payment/order reference and
  next action.

### 10. Sign in

- Customer login and password-recovery link.

### 11. Customer registration

- Required identity, contact, password confirmation, billing address, delivery
  address, and optional initial card.
- Display password-strength requirements.

### 12. Password recovery and reset

- Request reset and define a new password.

### 13. My account dashboard

- Customer summary, recent orders, saved addresses/cards, and a recommendation
  entry point.

### 14. Profile details

- Personal and contact-data updates, separate from address and password flows.

### 15. Change password

- Dedicated password-only update path.

### 16. Addresses

- List named billing/delivery addresses; set defaults; add, edit, and remove as
  allowed.

### 17. Saved cards

- List safely masked cards; set the preferred card; add and remove cards.
- Never display or retain CVV after authorization.

### 18. My orders

- Filterable order history with status, amount, dates, and detail links.

### 19. Order details and tracking

- Line items, delivery address, payment summary, and status timeline:
  `EM PROCESSAMENTO`, `APROVADA`, `EM TRANSPORTE`/`EM TRÂNSITO`, and
  `ENTREGUE`.
- Exchange-request action is available only after delivery.

### 20. Exchange request

- Select delivered item(s), provide the request information, and submit it.

### 21. Exchange details

- Exchange timeline: requested, authorized, received, and exchanged; returned
  inventory decision; generated exchange coupon.

### 22. My coupons

- Exchange, change, and promotional coupons with value, validity, status, and
  usage guidance.

## Admin screens

### 23. Admin login

- Separate role-protected administration entry.

### 24. Admin dashboard

- Pending orders, stock alerts, exchange requests, product status, and recent
  audit activity.

### 25. Product list

- Combined filters for product code, name, brand, barcode, category, pricing
  group, status, and attributes.
- Product creation and navigation to details/editing.

### 26. Create product

- Name, brand, one or more sports categories, description, dimensions, pricing
  group, barcode, size, color, material, model, and activation settings.

### 27. Edit product

- Update product data while retaining audit history.

### 28. Product status and deactivation

- Activate/deactivate products, requiring reason and category.
- Automatic `FORA DE MERCADO` deactivation must be visible and traceable.

### 29. Product details and audit history

- Complete product data, calculated price, stock summary, sales history, status
  history, and write-operation audit log.

### 30. Inventory list

- Product stock level, available/reserved quantity, supplier, entry cost/date,
  and stock alerts.

### 31. Register stock entry

- Product, positive quantity, fixed-precision cost, supplier, and entry date.
- Supports the highest-cost rule used to establish common sale price.

### 32. Stock movement history

- Entries, approved-sale reductions, exchange returns, adjustments, acting
  user, timestamp, and reason.

### 33. Pricing groups

- Manage pricing groups and margins used to calculate sale price.

### 34. Price exception approval

- Review and approve sales below the configured margin; restricted to the
  sales-manager authority.

### 35. Brands, categories, suppliers, and card brands

- Administration of master data required by products, stock, and cards.

### 36. Customer list

- Combined and individual-field search, active/inactive state, customer code,
  purchase-profile ranking, and purchase summary.

### 37. Customer details

- Customer profile, addresses, masked cards, transactions, status, and audit
  history.

### 38. Order management

- Filterable operational order list by status, date, customer, and payment
  outcome.

### 39. Order fulfilment details

- Inspect approved orders and transition them to `EM TRANSPORTE`/`EM TRÂNSITO`,
  then `ENTREGUE`, with explicit authorization and audit logging.

### 40. Payment and approval review

- Payment validation outcome, coupons, card-operator acceptance, rejection
  reason, and reservation-release status.

### 41. Exchange request management

- List/filter requests; authorize and notify; confirm receipt; choose whether
  items return to inventory; complete the exchange as `TROCADO`.

### 42. Coupon management

- Manage promotional coupons and inspect generated exchange/change coupons,
  validity, usage, and balances.

### 43. Sales analytics

- Date range of 1–24 months, multi-category selection, monthly line chart,
  exact-value tooltip, legend, automatic BRL axis, and zero-value months.

### 44. Analytics export

- Export the displayed period, categories, and sales values as a spreadsheet.

### 45. Audit log

- Cross-system searchable log of every write operation: timestamp, acting user,
  entity, before/after data, and action.

### 46. System parameters

- Reservation expiration, stockless-product automatic-deactivation threshold,
  and other controlled operational settings.

### 47. Admin users, roles, and permissions

- Manage authorization for price exceptions, fulfilment, exchanges, catalog
  administration, and other protected operations.

## Suggested delivery order

Prioritize the storefront/customer flow (screens 1–19) and core administration
(screens 23–43). Deliver chatbot, audit explorer, system parameters, and
admin-user management after the backend domain and authorization model exist.
