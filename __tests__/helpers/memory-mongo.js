// Base MongoDB simulée en mémoire pour les tests de services : égalité
// (ObjectId, dates, chaînes comparées comme chaînes), chemins pointés,
// $in, $ne, $lt, $lte, $gt, $gte, $exists, $or ; mises à jour $set, $unset,
// $push ; tri simple ; findOneAndUpdate avec returnDocument.
import { ObjectId } from "mongodb";

const isPlainObject = (value) =>
  value !== null &&
  typeof value === "object" &&
  !(value instanceof ObjectId) &&
  !(value instanceof Date) &&
  !Array.isArray(value);

const getPath = (doc, path) =>
  path
    .split(".")
    .reduce((value, key) => (value == null ? undefined : value[key]), doc);

function setPath(doc, path, value) {
  const keys = path.split(".");
  let target = doc;
  for (const key of keys.slice(0, -1)) {
    if (!isPlainObject(target[key])) target[key] = {};
    target = target[key];
  }
  target[keys.at(-1)] = value;
}

function unsetPath(doc, path) {
  const keys = path.split(".");
  let target = doc;
  for (const key of keys.slice(0, -1)) {
    if (!isPlainObject(target[key])) return;
    target = target[key];
  }
  delete target[keys.at(-1)];
}

const comparable = (value) =>
  value instanceof Date
    ? value.getTime()
    : value instanceof ObjectId
      ? String(value)
      : value;
const same = (a, b) => {
  if (a == null || b == null) return a == null && b == null;
  return String(comparable(a)) === String(comparable(b));
};

function testCondition(value, cond) {
  if (isPlainObject(cond) && Object.keys(cond).some((k) => k.startsWith("$"))) {
    return Object.entries(cond).every(([op, arg]) => {
      switch (op) {
        case "$in":
          return arg.some((c) => same(value, c));
        case "$nin":
          return !arg.some((c) => same(value, c));
        case "$ne":
          return !same(value, arg);
        case "$exists":
          return arg ? value !== undefined : value === undefined;
        case "$lt":
          return value != null && comparable(value) < comparable(arg);
        case "$lte":
          return value != null && comparable(value) <= comparable(arg);
        case "$gt":
          return value != null && comparable(value) > comparable(arg);
        case "$gte":
          return value != null && comparable(value) >= comparable(arg);
        default:
          throw new Error(`Opérateur non simulé : ${op}`);
      }
    });
  }
  if (Array.isArray(value) && !Array.isArray(cond)) {
    return value.some((item) => same(item, cond));
  }
  return same(value, cond);
}

export function matches(doc, filter = {}) {
  return Object.entries(filter).every(([key, cond]) => {
    if (key === "$or") return cond.some((sub) => matches(doc, sub));
    if (key === "$and") return cond.every((sub) => matches(doc, sub));
    return testCondition(getPath(doc, key), cond);
  });
}

function applyUpdate(doc, update) {
  for (const [path, value] of Object.entries(update.$set || {})) {
    setPath(doc, path, value);
  }
  for (const path of Object.keys(update.$unset || {})) unsetPath(doc, path);
  for (const [path, value] of Object.entries(update.$push || {})) {
    const list = getPath(doc, path);
    setPath(doc, path, [...(Array.isArray(list) ? list : []), value]);
  }
}

function sortRows(rows, sort) {
  const entries = Object.entries(sort || {});
  if (entries.length === 0) return rows;
  return [...rows].sort((a, b) => {
    for (const [key, dir] of entries) {
      const x = comparable(getPath(a, key));
      const y = comparable(getPath(b, key));
      if (x === y) continue;
      if (x === undefined) return 1;
      if (y === undefined) return -1;
      return (x < y ? -1 : 1) * (dir < 0 ? -1 : 1);
    }
    return 0;
  });
}

export function createMemoryMongo() {
  const data = {};
  const collection = (name) => {
    data[name] ||= [];
    const rows = data[name];
    return {
      async findOne(filter, options = {}) {
        return (
          sortRows(
            rows.filter((d) => matches(d, filter)),
            options.sort,
          )[0] || null
        );
      },
      find(filter, options = {}) {
        let result = sortRows(
          rows.filter((d) => matches(d, filter)),
          options.sort,
        );
        const cursor = {
          sort(sort) {
            result = sortRows(result, sort);
            return cursor;
          },
          limit(n) {
            result = result.slice(0, n);
            return cursor;
          },
          toArray: async () => result,
        };
        return cursor;
      },
      async insertOne(doc) {
        const row = { _id: doc._id || new ObjectId(), ...doc };
        rows.push(row);
        return { insertedId: row._id };
      },
      async updateOne(filter, update) {
        const row = rows.find((d) => matches(d, filter));
        if (!row) return { matchedCount: 0, modifiedCount: 0 };
        applyUpdate(row, update);
        return { matchedCount: 1, modifiedCount: 1 };
      },
      async updateMany(filter, update) {
        const found = rows.filter((d) => matches(d, filter));
        found.forEach((row) => applyUpdate(row, update));
        return { matchedCount: found.length, modifiedCount: found.length };
      },
      async findOneAndUpdate(filter, update, options = {}) {
        const row = rows.find((d) => matches(d, filter));
        if (!row) return null;
        const before = structuredClone(row);
        applyUpdate(row, update);
        return options.returnDocument === "after" ? row : before;
      },
      async deleteOne(filter) {
        const i = rows.findIndex((d) => matches(d, filter));
        if (i >= 0) rows.splice(i, 1);
        return { deletedCount: i >= 0 ? 1 : 0 };
      },
      async deleteMany(filter) {
        let count = 0;
        for (let i = rows.length - 1; i >= 0; i -= 1) {
          if (matches(rows[i], filter)) {
            rows.splice(i, 1);
            count += 1;
          }
        }
        return { deletedCount: count };
      },
    };
  };
  return { collection, data };
}
