# Sports Equipment E-commerce — Development Requirements

This repository implements a sports-equipment e-commerce system, adapted from
the functional structure defined in
`/Users/henriquehida/Downloads/DRS_LES_2_2026.docx` (version 0.7, dated
10/08/2026). The document provides the functional baseline; this file is the
source of truth for its sports-equipment adaptation. Preserve the requirement
IDs below in issues, commits, tests, and traceability notes.

## General implementation rules

- Implement the functional requirements (RF), non-functional requirements
  (RNF), and business rules (RN) below. Do not substitute an assumption when a
  requirement is explicit.
- Enforce business rules on the server/domain layer. Client-side validation is
  supplementary only.
- Model money using fixed-precision decimal values; never use binary floating
  point for prices, coupons, freight, or sales analytics.
- Record an audit log for every write operation, including date/time, acting
  user, and the changed data (RNF0012).
- User queries must respond in at most one second (RNF0011). Design indexes,
  filters, and pagination accordingly.
- Seed all required domain records (for example pricing groups, brands,
  suppliers, card brands, statuses, and categories) through an
  idempotent deployment/seed script (RNF0013).
- Keep status transitions explicit, authorized, and test-covered. Do not allow
  direct state changes that bypass the rules below.

## Products and inventory

- Maintain unique sports-equipment products, with create, update, filtered
  search, activation, and deactivation (RF0011–RF0016). Searches must support
  every identifying field, alone or combined.
- A product requires name, brand, one or more sports categories, description,
  dimensions (height, width, weight, and depth), pricing group, and barcode.
  Include product-specific attributes such as size, color, material, and model
  where applicable. Assign a unique product code (adapted from RN0011–RN0012
  and RNF0021).
- Sale price is cost plus the configured margin of its pricing group
  (RF0052, RN0013). A price below that margin requires sales-manager approval
  (RN0014). When stock entries have different costs, use the highest cost to
  determine the common sale price (RN0051).
- Manual deactivation requires a reason and category; automatic deactivation
  must be categorized as `FORA DE MERCADO` (RN0015–RN0017). Automatically
  deactivate products that have no stock and no sale below the system parameter
  (RF0013).
- Stock entries require product, positive quantity, cost, supplier, and entry
  date (RF0051, RN0050, RN0061, RN0062, RNF0064). Reduce stock only after a
  purchase is effectively approved; return stock when a qualifying exchange is
  received (RF0053–RF0054, RN0028).

## Customers

- Support customer creation, update, deactivation, combined/individual-field
  search, transaction history, delivery addresses, saved cards, and a
  password-only update path (RF0021–RF0028).
- Assign a unique customer code and numeric purchase-profile ranking
  (RNF0035, RN0027). Require gender, name, birth date, CPF, phone type/DDD/
  number, email, password, and residential address (RN0026).
- Require at least one billing address and one delivery address (RN0021–RN0022).
  Addresses require residence type, street type, street, number, neighborhood,
  CEP, city, state, and country; notes are optional (RN0023). Allow address
  changes/additions without editing unrelated customer data (RNF0034).
- Support multiple named delivery addresses and multiple cards, with one
  preferred card (RF0026–RF0027). Cards require number, printed name, brand,
  and security code; the brand must exist in the registered brands (RN0024–
  RN0025). Never store raw card security codes after authorization.
- Enforce passwords of at least eight characters with upper-case, lower-case,
  and special characters; require confirmation on registration; store only a
  secure password hash (RNF0031–RNF0033).

## Cart, checkout, payments, and fulfilment

- The cart supports adding, viewing, changing quantities, and removing items
  (RF0031–RF0032). Never add a quantity greater than available stock
  (RN0031).
- Adding an item temporarily reserves it. The reservation is based on the last
  item added, expires after a configurable period, warns the customer five
  minutes before expiry, and then removes/unlocks all instances of that product
  from the originating cart (RN0044–RN0045). Show expired/removed items with
  the configured remaining/expired time and disable checkout until they are
  added again (RNF0042).
- Revalidate stock at checkout. If availability changed, notify the customer,
  update quantities, and remove unavailable items with an alert (RN0032).
- Calculate shipping from selected items and delivery address. Permit an
  existing delivery address or a new one that may be saved to the profile
  (RF0034–RF0035).
- Permit saved/new cards and exchange/promotional coupons; new cards may be
  saved (RF0036–RF0037). Only one promotional coupon may be used per purchase.
  Multiple cards are allowed only with at least R$ 10,00 on each card, except
  when coupons cover the rest as defined by RN0035. Use the maximum coupon
  value when coupons and cards are combined; do not allow unnecessary coupon
  combinations (RN0033–RN0036).
- Checkout first creates `EM PROCESSAMENTO` (RF0038). Validate coupon validity
  and card-operator acceptance, then transition to `APROVADA` or `REPROVADA`
  (RN0037–RN0038). Release reservations and preserve stock for non-approved
  purchases (RN0028).
- Administrators can transition approved sales to `EM TRANSPORTE` and confirm
  them as `ENTREGUE` (RF0039–RF0040, RN0039–RN0040).

## Exchanges

- Customers may request exchanges only for items in `ENTREGUE` orders
  (RF0041, RN0043). A requested item/order becomes `EM TROCA`.
- Administrators can list exchange requests, authorize them (`TROCA
  AUTORIZADA`) and notify the customer, confirm receipt, choose whether the
  items return to inventory, and transition the request/order to `TROCADO`
  (RF0042–RF0045, RN0041–RN0042, RN0046).
- Generate and make available an exchange coupon after the returned items are
  received. Also generate a change coupon if coupon payment exceeds the order
  total (RF0045, RN0036).

## Sales analytics

- Administrators can analyze sales by product category over a selected start
  and end date; end date cannot precede start date (RF0055–RF0056).
- Permit one or more categories for comparison and export the displayed period,
  category, and sale value as a spreadsheet (RF0057–RF0058).
- Display a line chart: months on X; BRL total sales on Y; one distinct line per
  category; bottom legend; tooltip with the exact category value (RNF0043–
  RNF0046).
- Format values as Brazilian currency and scale the Y axis automatically
  (RNF0044). The range must be 1–24 months, group approved sales by month,
  render zero for months without a category sale, and include only `APROVADA`,
  `EM TRANSPORTE`/`EM TRÂNSITO`, and `ENTREGUE` sales (RN0071–RN0074).

## Personalized recommendations

- Integrate generative AI to offer personalized sports-equipment recommendations
  based on purchase history and preferences (RNF0044, "Recomendação personalizada").
- Provide a chatbot for product discovery, questions, and relevant-content
  suggestions. Treat sales and user-feedback data as inputs for continual
  personalization.
- Do not expose customer data or secrets to the model. Minimize data sent to
  providers and require explicit approval for any provider, model, retention,
  or training-data decision not already established by the project.

## Source-document ambiguities

- The source reuses some identifiers: `RNF0044` denotes both monetary-axis
  formatting and the generative-AI requirement; `RNF0013` appears under the
  original book section; `RNF0064` is labelled as an RN; and the analysis grouping is labelled
  `GRUPO: ANÁLISE`. Retain the original labels for traceability, but use the
  requirement name and section to disambiguate them in code and tests.
- The document uses both `EM TRANSPORTE` and `EM TRÂNSITO`; treat them as the
  same fulfilment state unless a product decision explicitly separates them.
