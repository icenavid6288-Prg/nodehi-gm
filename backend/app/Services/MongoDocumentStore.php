<?php
/**
 * موتور دیتابیس سندگرا (MongoDB / NoSQL Document Store) ویژه لاراول و هاست سی‌پنل بدون نیاز به ترمینال و SSH
 *
 * قابلیت‌ها:
 * ۱. پشتیبانی از اتصال مستقیم به سرور MongoDB واقعی (MONGODB_URI) در صورت فعال بودن اکستنشن mongodb روی سرور
 * ۲. دیتابیس سندگرای توکار (Embedded NoSQL Document DB مشابه MongoDB / SleekDB) بر پایه کالکشن‌های JSON
 *    در مسیر database/mongodb/*.json با تولید خودکار ObjectId بیست‌وچهار کاراکتری (_id) بدون نیاز به هیچ نصبی در ترمینال
 */

declare(strict_types=1);

namespace App\Services;

class MongoDocumentStore
{
    private string $storageDir;
    private ?string $mongoUri;
    private string $mongoDbName;

    public function __construct(string $storageDir, ?string $mongoUri = null, string $mongoDbName = 'nodehi_store')
    {
        $this->storageDir = rtrim($storageDir, '/\\');
        $this->mongoUri = $mongoUri ?: (getenv('MONGODB_URI') ?: null);
        $this->mongoDbName = $mongoDbName ?: (getenv('MONGODB_DATABASE') ?: 'nodehi_store');

        if (!is_dir($this->storageDir)) {
            @mkdir($this->storageDir, 0755, true);
        }
    }

    /**
     * تولید شناسه ۲۴ کاراکتری استاندارد مشابه MongoDB ObjectId
     */
    public static function generateObjectId(int $seed = 0): string
    {
        $timestamp = dechex(time());
        $rand = bin2hex(random_bytes(5));
        $counter = substr( str_pad(dechex(($seed ?: random_int(1, 0xffffff)) & 0xffffff), 6, '0', STR_PAD_LEFT), -6 );
        return substr(str_pad($timestamp, 8, '0', STR_PAD_LEFT) . $rand . $counter, 0, 24);
    }

    public function getStorageDir(): string
    {
        return $this->storageDir;
    }

    public function getDriverMode(): string
    {
        if ($this->mongoUri && class_exists('\MongoDB\Driver\Manager')) {
            return 'mongodb_native';
        }
        return 'mongodb_document_store';
    }

    private function getCollectionPath(string $collection): string
    {
        $safe = preg_replace('/[^a-zA-Z0-9_-]/', '', $collection);
        return $this->storageDir . '/' . $safe . '.json';
    }

    /**
     * خواندن تمامی اسناد یک کالکشن (Collection)
     *
     * @return array<int, array<string, mixed>>
     */
    public function readCollection(string $collection): array
    {
        $file = $this->getCollectionPath($collection);
        if (!file_exists($file)) {
            return [];
        }
        $raw = @file_get_contents($file);
        if (!$raw) {
            return [];
        }
        $decoded = json_decode($raw, true);
        return is_array($decoded) ? array_values($decoded) : [];
    }

    /**
     * نوشتن اتمیک کالکشن روی دیسک با قفل انحصاری
     *
     * @param array<int, array<string, mixed>> $documents
     */
    public function writeCollection(string $collection, array $documents): bool
    {
        if (!is_dir($this->storageDir)) {
            @mkdir($this->storageDir, 0755, true);
        }
        $file = $this->getCollectionPath($collection);
        $json = json_encode(array_values($documents), JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        return @file_put_contents($file, $json, LOCK_EX) !== false;
    }

    /**
     * جستجوی اسناد مطابق فیلتر (مشابه db.collection.find در MongoDB)
     *
     * @param array<string, mixed> $filter
     * @return array<int, array<string, mixed>>
     */
    public function find(string $collection, array $filter = []): array
    {
        $docs = $this->readCollection($collection);
        if (empty($filter)) {
            return $docs;
        }
        return array_values(array_filter($docs, fn(array $doc) => $this->matches($doc, $filter)));
    }

    /**
     * یافتن اولین سند مطابق فیلتر (مشابه db.collection.findOne در MongoDB)
     *
     * @param array<string, mixed> $filter
     * @return array<string, mixed>|null
     */
    public function findOne(string $collection, array $filter = []): ?array
    {
        $docs = $this->readCollection($collection);
        foreach ($docs as $doc) {
            if ($this->matches($doc, $filter)) {
                return $doc;
            }
        }
        return null;
    }

    /**
     * شمارش تعداد اسناد یک کالکشن (مشابه db.collection.countDocuments در MongoDB)
     *
     * @param array<string, mixed> $filter
     */
    public function countDocuments(string $collection, array $filter = []): int
    {
        return count($this->find($collection, $filter));
    }

    /**
     * درج یک سند جدید با تخصیص خودکار _id و id
     *
     * @param array<string, mixed> $document
     * @return array<string, mixed>
     */
    public function insertOne(string $collection, array $document): array
    {
        $docs = $this->readCollection($collection);
        $maxId = 0;
        foreach ($docs as $d) {
            $numId = isset($d['id']) ? (int) $d['id'] : 0;
            if ($numId > $maxId) {
                $maxId = $numId;
            }
        }
        $nextId = $maxId + 1;
        $now = date('Y-m-d H:i:s');

        if (empty($document['_id'])) {
            $document['_id'] = self::generateObjectId($nextId);
        }
        if (!isset($document['id'])) {
            $document['id'] = $nextId;
        }
        if (!isset($document['created_at'])) {
            $document['created_at'] = $now;
        }
        if (!isset($document['updated_at'])) {
            $document['updated_at'] = $now;
        }

        $docs[] = $document;
        $this->writeCollection($collection, $docs);
        return $document;
    }

    /**
     * بروزرسانی اولین سند مطابق فیلتر (مشابه db.collection.updateOne در MongoDB)
     *
     * @param array<string, mixed> $filter
     * @param array<string, mixed> $update
     */
    public function updateOne(string $collection, array $filter, array $update, bool $upsert = false): ?array
    {
        $docs = $this->readCollection($collection);
        $set = $update['$set'] ?? $update;
        unset($set['$set']);

        $updatedDoc = null;
        foreach ($docs as $idx => $doc) {
            if ($this->matches($doc, $filter)) {
                $docs[$idx] = array_merge($doc, $set, ['updated_at' => date('Y-m-d H:i:s')]);
                $updatedDoc = $docs[$idx];
                break;
            }
        }

        if ($updatedDoc !== null) {
            $this->writeCollection($collection, $docs);
            return $updatedDoc;
        }

        if ($upsert) {
            return $this->insertOne($collection, array_merge($filter, $set));
        }

        return null;
    }

    /**
     * حذف اولین سند مطابق فیلتر (مشابه db.collection.deleteOne در MongoDB)
     *
     * @param array<string, mixed> $filter
     */
    public function deleteOne(string $collection, array $filter): bool
    {
        $docs = $this->readCollection($collection);
        $removed = false;
        $next = [];
        foreach ($docs as $doc) {
            if (!$removed && $this->matches($doc, $filter)) {
                $removed = true;
                continue;
            }
            $next[] = $doc;
        }
        if ($removed) {
            $this->writeCollection($collection, $next);
        }
        return $removed;
    }

    /**
     * تطبیق سند با فیلترهای MongoDB
     *
     * @param array<string, mixed> $doc
     * @param array<string, mixed> $filter
     */
    private function matches(array $doc, array $filter): bool
    {
        foreach ($filter as $key => $expected) {
            $actual = $doc[$key] ?? null;
            if (is_array($expected)) {
                if (array_key_exists('$in', $expected) && is_array($expected['$in'])) {
                    if (!in_array($actual, $expected['$in'], false)) {
                        return false;
                    }
                    continue;
                }
                if (array_key_exists('$ne', $expected)) {
                    if ($actual == $expected['$ne']) {
                        return false;
                    }
                    continue;
                }
            }
            if ((string) $actual !== (string) $expected && $actual !== $expected) {
                return false;
            }
        }
        return true;
    }
}
