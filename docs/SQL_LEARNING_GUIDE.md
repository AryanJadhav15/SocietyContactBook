# SQL Learning Guide

This project deliberately uses both Prisma and parameterized MySQL queries. Prisma keeps the schema and routine CRUD maintainable; raw SQL is used where it helps you learn joins, filters, aggregate functions, pagination, and transactions.

## Tables And Keys

Every table has a primary key. For example, `contacts.id` is the internal database identifier. Business rules use additional unique keys, such as:

```sql
UNIQUE (society_id, contact_code)
UNIQUE (society_id, building, flat_number)
UNIQUE (category_id, name)
```

Foreign keys preserve relationships. `contacts.category_id` must reference an existing category, and `contact_flat_associations.flat_id` must reference an existing flat.

## Insert

Creating a flat inserts one row into `flats`:

```sql
INSERT INTO flats (society_id, building, flat_number, floor, status)
VALUES (?, ?, ?, ?, 'ACTIVE');
```

The `?` placeholders are parameters supplied by mysql2. This prevents SQL injection because user input is treated as data, not executable SQL.

## Select, Where, Order, Limit

The contact directory searches by name, mobile number, and contact code:

```sql
SELECT co.id, co.contact_code, co.person_name, co.mobile_number
FROM contacts co
WHERE co.society_id = ?
  AND (co.person_name LIKE ? OR co.mobile_number LIKE ? OR co.contact_code LIKE ?)
ORDER BY co.person_name ASC
LIMIT ? OFFSET ?;
```

`LIMIT` and `OFFSET` implement server-side pagination. Page 1 with page size 20 uses `LIMIT 20 OFFSET 0`; page 2 uses `LIMIT 20 OFFSET 20`.

## Joins

Contacts join to categories and subcategories for readable directory rows:

```sql
SELECT co.person_name, cat.name AS category_name, sub.name AS subcategory_name
FROM contacts co
INNER JOIN categories cat ON cat.id = co.category_id
INNER JOIN subcategories sub ON sub.id = co.subcategory_id
WHERE co.society_id = ?;
```

`INNER JOIN` requires matching rows. `LEFT JOIN` is used for optional relationships, such as category counts where a category may have zero contacts.

## Many-To-Many Relationships

A contact can have many work types, and a work type can belong to many contacts. The linking table is `contact_work_types`:

```sql
INSERT INTO contact_work_types (contact_id, work_type_id)
VALUES (?, ?);
```

The primary key is both columns together, so the same work type cannot be attached to the same contact twice.

## Group By And Counts

Dashboard category statistics use `GROUP BY`:

```sql
SELECT c.name, COUNT(co.id) AS count
FROM categories c
LEFT JOIN contacts co
  ON co.category_id = c.id
 AND co.society_id = c.society_id
 AND co.status = 'ACTIVE'
WHERE c.society_id = ?
GROUP BY c.id, c.name
ORDER BY c.name;
```

The `LEFT JOIN` keeps categories visible even when their count is zero.

## Transactions

Creating a contact touches several tables: contact code sequence, contact row, work details, work types, services, and flat associations. Those changes run in a transaction so either everything succeeds or everything rolls back.

```sql
SELECT next_value
FROM contact_sequences
WHERE society_id = ?
FOR UPDATE;
```

`FOR UPDATE` locks the sequence row until the transaction finishes. That is what prevents two admins from receiving the same contact code at the same time.

## Equivalent Prisma Example

Raw SQL:

```sql
SELECT * FROM flats WHERE society_id = ? AND status = 'ACTIVE';
```

Prisma:

```js
await prisma.flat.findMany({
  where: { societyId, status: 'ACTIVE' }
});
```

Both are useful. Prisma reduces repetitive CRUD code, while raw SQL makes joins and query execution clearer while you learn.

## Useful Exploration Queries

```sql
SELECT * FROM societies;
SELECT contact_code, person_name, mobile_number FROM contacts ORDER BY created_at DESC;
SELECT building, flat_number FROM flats ORDER BY building, flat_number;
SELECT wt.name FROM work_types wt ORDER BY wt.name;
SELECT co.person_name, f.building, f.flat_number, cfa.timing
FROM contact_flat_associations cfa
INNER JOIN contacts co ON co.id = cfa.contact_id
INNER JOIN flats f ON f.id = cfa.flat_id
WHERE cfa.society_id = ?;
```
