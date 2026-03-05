-- ============================================================================
-- DICTIONARY MODULE — Sample Seed Data  (30 entries for UI testing)
-- ============================================================================
-- Run this in the Supabase SQL editor AFTER running:
--   1. dictionary_schema.sql
--   2. dictionary_functions.sql
--
-- Requires at least one user to exist in public.profiles.
-- Safe to run multiple times (all inserts are idempotent via ON CONFLICT).
-- ============================================================================

DO $seed$
DECLARE
  v_uid uuid;
BEGIN
  -- Pick the first existing user to attribute all seed entries to
  SELECT id INTO v_uid FROM public.profiles ORDER BY created_at LIMIT 1;
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'No user profiles found. Create an account first, then run this seed.';
  END IF;
  RAISE NOTICE 'Using profile % for seed authorship', v_uid;

  -- ══════════════════════════════════════════════════════════════════════════
  -- 1. TAGS
  -- ══════════════════════════════════════════════════════════════════════════
  INSERT INTO public.tags (name) VALUES
    ('algorithms'),
    ('artificial-intelligence'),
    ('machine-learning'),
    ('neural-networks'),
    ('deep-learning'),
    ('data-science'),
    ('big-data'),
    ('cloud'),
    ('infrastructure'),
    ('programming'),
    ('software-engineering'),
    ('web-development'),
    ('design-patterns'),
    ('data-structures'),
    ('performance'),
    ('agile'),
    ('project-management'),
    ('architecture'),
    ('devops'),
    ('automation'),
    ('typescript'),
    ('javascript'),
    ('version-control'),
    ('git'),
    ('computer-science'),
    ('security'),
    ('networking'),
    ('open-source'),
    ('digital'),
    ('databases')
  ON CONFLICT (name) DO NOTHING;

  -- ══════════════════════════════════════════════════════════════════════════
  -- 2. ENTRIES — 20 English-primary terms
  -- ══════════════════════════════════════════════════════════════════════════
  INSERT INTO public.dictionary_entries
    (term, slug, reading, language_code, definition, status, created_by, views, saves)
  VALUES
    (
      'Algorithm', 'algorithm', NULL, 'en',
      'A step-by-step procedure or formula for solving a problem. Algorithms describe the exact logic a computer follows — from sorting a list to training an AI model — expressed in a sequence of finite, well-defined instructions.',
      'approved', v_uid, 845, 234
    ),
    (
      'Machine Learning', 'machine-learning', NULL, 'en',
      'A branch of artificial intelligence in which systems learn from data to improve their performance on tasks without being explicitly programmed. Common techniques include supervised learning, unsupervised learning, and reinforcement learning.',
      'approved', v_uid, 1203, 412
    ),
    (
      'Deep Learning', 'deep-learning', NULL, 'en',
      'A subset of machine learning that uses multi-layer neural networks to learn hierarchical representations of data. It powers state-of-the-art results in image recognition, natural language processing, and speech synthesis.',
      'approved', v_uid, 987, 315
    ),
    (
      'Neural Network', 'neural-network', NULL, 'en',
      'A computational model loosely inspired by the human brain, composed of layers of interconnected nodes called neurons. Connection weights are adjusted during training to minimize prediction error via backpropagation.',
      'approved', v_uid, 754, 198
    ),
    (
      'Big Data', 'big-data', NULL, 'en',
      'Extremely large datasets that cannot be efficiently processed using traditional databases. Characterized by the three Vs: Volume (scale of data), Velocity (speed of generation), and Variety (structured, unstructured, semi-structured formats).',
      'approved', v_uid, 523, 145
    ),
    (
      'Cloud Computing', 'cloud-computing', NULL, 'en',
      'The on-demand delivery of computing services — servers, storage, databases, networking, and software — over the internet. Users pay only for what they consume, enabling rapid scaling without upfront hardware investment.',
      'approved', v_uid, 891, 267
    ),
    (
      'API', 'api', NULL, 'en',
      'Application Programming Interface — a contract defining how software components communicate with each other. An API specifies the requests a system can handle, the data formats it accepts, and the responses it returns, enabling modular and interoperable software.',
      'approved', v_uid, 1456, 489
    ),
    (
      'Recursion', 'recursion', NULL, 'en',
      'A programming technique where a function solves a problem by calling itself on a smaller sub-problem. Every recursive function must have a base case that terminates the recursion to prevent an infinite loop and stack overflow.',
      'approved', v_uid, 612, 187
    ),
    (
      'Object-Oriented Programming', 'object-oriented-programming', NULL, 'en',
      'A programming paradigm that models real-world entities as objects containing both data (attributes) and behavior (methods). Core principles include encapsulation, inheritance, abstraction, and polymorphism.',
      'approved', v_uid, 743, 221
    ),
    (
      'Data Structure', 'data-structure', NULL, 'en',
      'A particular way of organizing and storing data in a computer so that it can be accessed and modified efficiently. Choosing the right data structure — array, linked list, tree, graph — is often the key to writing performant algorithms.',
      'approved', v_uid, 698, 203
    ),
    (
      'Binary Search', 'binary-search', NULL, 'en',
      'An efficient search algorithm that finds a target value in a sorted array by repeatedly halving the search space. It achieves O(log n) time complexity — far faster than linear search for large datasets.',
      'approved', v_uid, 534, 167
    ),
    (
      'Hash Table', 'hash-table', NULL, 'en',
      'A data structure that maps keys to values using a hash function, enabling average O(1) time complexity for insertion, deletion, and lookup. Collisions are handled via chaining or open addressing.',
      'approved', v_uid, 478, 143
    ),
    (
      'Stack', 'stack', NULL, 'en',
      'A linear data structure following the Last-In-First-Out (LIFO) principle. Elements are added (push) and removed (pop) from the same end called the top. Stacks underpin function call management, expression parsing, and undo operations.',
      'approved', v_uid, 389, 112
    ),
    (
      'Queue', 'queue', NULL, 'en',
      'A linear data structure following the First-In-First-Out (FIFO) principle. Elements are enqueued at the rear and dequeued from the front. Queues are used in BFS graph traversal, task scheduling, and message buffering systems.',
      'approved', v_uid, 356, 104
    ),
    (
      'Time Complexity', 'time-complexity', NULL, 'en',
      'A measure of how the running time of an algorithm scales with the size of its input, expressed using Big O notation. Understanding time complexity helps engineers select algorithms that remain fast as data grows — e.g., O(1) < O(log n) < O(n) < O(n²).',
      'approved', v_uid, 623, 189
    ),
    (
      'Agile', 'agile', NULL, 'en',
      'An iterative software development methodology that delivers working software in short cycles called sprints. Agile prioritizes customer collaboration, adaptive planning, and rapid response to change over rigid upfront documentation.',
      'approved', v_uid, 445, 132
    ),
    (
      'Microservices', 'microservices', NULL, 'en',
      'An architectural pattern that decomposes an application into small, independently deployable services, each owning its own database and communicating over well-defined APIs. Microservices improve scalability and team autonomy at the cost of increased operational complexity.',
      'approved', v_uid, 567, 176
    ),
    (
      'DevOps', 'devops', NULL, 'en',
      'A cultural and technical movement that bridges software development (Dev) and IT operations (Ops). DevOps practices include continuous integration, continuous delivery (CI/CD), infrastructure as code, and automated monitoring to accelerate reliable software delivery.',
      'approved', v_uid, 634, 198
    ),
    (
      'TypeScript', 'typescript', NULL, 'en',
      'A strongly-typed superset of JavaScript developed by Microsoft that compiles down to plain JavaScript. TypeScript adds optional static typing, interfaces, and generics, catching bugs at compile time rather than runtime and improving IDE support.',
      'approved', v_uid, 892, 287
    ),
    (
      'Version Control', 'version-control', NULL, 'en',
      'A system that records changes to files over time so specific versions can be recalled later. Version control enables collaboration, rollback to stable states, parallel branching, and a full audit trail of who changed what and when. Git is the most widely used implementation.',
      'approved', v_uid, 578, 171
    )
  ON CONFLICT (slug) DO NOTHING;

  -- ══════════════════════════════════════════════════════════════════════════
  -- 3. ENTRIES — 5 Japanese-primary terms
  -- ══════════════════════════════════════════════════════════════════════════
  INSERT INTO public.dictionary_entries
    (term, slug, reading, language_code, definition, status, created_by, views, saves)
  VALUES
    (
      'ソフトウェア工学', 'software-engineering-ja', 'ソフトウェアこうがく', 'ja',
      'ソフトウェアの設計・開発・テスト・保守に工学的原則と方法論を体系的に適用する学問分野。品質・信頼性・保守性の高いソフトウェアを、決められたコストとスケジュール内に構築することを目的とする。',
      'approved', v_uid, 312, 89
    ),
    (
      'デジタル変革', 'digital-transformation', 'デジタルへんかく', 'ja',
      'デジタル技術を活用して企業のビジネスモデル、プロセス、文化、顧客体験を根本的に変革すること。単なるデジタル化とは異なり、組織全体の思考様式と価値創造の仕組みを再定義する継続的な取り組みである。',
      'approved', v_uid, 289, 76
    ),
    (
      'オープンソース', 'open-source', NULL, 'ja',
      'ソースコードが公開されており、誰でも閲覧・変更・配布できるソフトウェア開発・配布モデル。Linux、Git、Kubernetes などが代表例であり、世界中の開発者コミュニティによる貢献が成長の原動力となる。',
      'approved', v_uid, 423, 118
    ),
    (
      'プログラミング言語', 'programming-language', 'プログラミングげんご', 'ja',
      'コンピュータに命令を与えるための形式言語。構文（シンタックス）と意味論（セマンティクス）のルールに基づいて記述されたコードは、コンパイルまたはインタープリトを経て機械語に変換・実行される。',
      'approved', v_uid, 534, 156
    ),
    (
      'サイバーセキュリティ', 'cybersecurity', NULL, 'ja',
      'コンピュータシステム、ネットワーク、プログラム、データへのデジタル攻撃や不正アクセスからシステムを保護するための実践・技術・プロセスの総称。情報セキュリティの三原則として機密性・完全性・可用性（CIA）の確保が基本目標とされる。',
      'approved', v_uid, 467, 134
    )
  ON CONFLICT (slug) DO NOTHING;

  -- ══════════════════════════════════════════════════════════════════════════
  -- 4. ENTRIES — 5 Mongolian-primary terms
  -- ══════════════════════════════════════════════════════════════════════════
  INSERT INTO public.dictionary_entries
    (term, slug, reading, language_code, definition, status, created_by, views, saves)
  VALUES
    (
      'Програм хангамж', 'software-mn', NULL, 'mn',
      'Тодорхой ажлыг гүйцэтгэхэд зориулагдсан компьютерийн програм, өгөгдөл болон бусад инструкцуудын цогц. Систем програм хангамж (үйлдлийн систем) болон хэрэглээний програм хангамж гэж ерөнхийд нь ангилдаг.',
      'approved', v_uid, 198, 56
    ),
    (
      'Мэдээллийн аюулгүй байдал', 'information-security', NULL, 'mn',
      'Мэдээллийг зөвшөөрөлгүй нэвтрэлт, ашиглалт, задруулалт, тасалдал, өөрчлөлт, устгалаас хамгаалах практик арга хэмжээний систем. Гурван үндсэн зарчмаас бүрдэнэ: нууцлал (Confidentiality), бүрэн бүтэн байдал (Integrity), хүртээмжтэй байдал (Availability).',
      'approved', v_uid, 234, 67
    ),
    (
      'Цахим технологи', 'digital-technology', NULL, 'mn',
      'Мэдээллийг дижитал хэлбэрт оруулж боловсруулах, хадгалах, дамжуулах, дүрслэхэд ашиглагддаг технологи, хэрэгслүүдийн нэгдэл. Аналоги технологиос ялгаатай нь хоёртын (0 ба 1) тогтолцоонд суурилж ажилладаг.',
      'approved', v_uid, 167, 48
    ),
    (
      'Өгөгдлийн сан', 'database-mn', NULL, 'mn',
      'Тогтолцоотой байдлаар зохион байгуулж хадгалсан мэдээллийн цуглуулга. Мэдээллийн сангийн удирдлагын систем (ДБМС) хэрэглэгчдэд өгөгдлийг хайж олох, оруулах, шинэчлэх, устгах боломжийг үр дүнтэй олгодог. Harилбарлагдах (SQL) болон Харилбарлагдахгүй (NoSQL) гэж ангилдаг.',
      'approved', v_uid, 312, 89
    ),
    (
      'Цахим сүлжээ', 'computer-network', NULL, 'mn',
      'Мэдээлэл солилцох болон нөөцийг хуваалцах зорилгоор кабель эсвэл утасгүй технологиор хоорондоо холбогдсон компьютер болон бусад төхөөрөмжүүдийн систем. Орон нутгийн сүлжээ (LAN), дэлхийн тархалттай сүлжээ (WAN), интернет гэж ангилагдана.',
      'approved', v_uid, 189, 54
    )
  ON CONFLICT (slug) DO NOTHING;

  -- ══════════════════════════════════════════════════════════════════════════
  -- 5. TRANSLATIONS — English entries → MN + JA
  -- ══════════════════════════════════════════════════════════════════════════

  -- Algorithm
  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'mn', 'Алгоритм', 'Асуудлыг шийдэх алхам алхмаар тайлбарласан зааврын эцсийн дараалал', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'algorithm'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'mn');

  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'ja', 'アルゴリズム', '問題を解くための手順を定義した有限のステップ列', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'algorithm'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'ja');

  -- Machine Learning
  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'mn', 'Машин сургалт', 'Компьютерийн систем өгөгдлөөс сурч, байгалийн дагуу сайжирдаг AI-ийн аргачлал', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'machine-learning'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'mn');

  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'ja', '機械学習', 'データから自動的に学習し、予測や意思決定を継続的に改善するAIの手法', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'machine-learning'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'ja');

  -- Deep Learning
  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'mn', 'Гүн сургалт', 'Олон давхаргат нейрон сүлжээ ашиглан өгөгдлийн шатлалт онцлогийг автоматаар суралцах арга', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'deep-learning'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'mn');

  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'ja', 'ディープラーニング', '多層ニューラルネットワークを用いてデータの階層的な特徴を自動的に学習する手法', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'deep-learning'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'ja');

  -- Neural Network
  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'mn', 'Нейрон сүлжээ', 'Хүний тархины бүтцээс санаа авсан, хоорондоо холбоотой нейронуудаас бүрдсэн тооцоолуурын загвар', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'neural-network'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'mn');

  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'ja', 'ニューラルネットワーク', '人間の神経回路を模倣した、複数層の相互接続ノードからなる計算モデル', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'neural-network'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'ja');

  -- Big Data
  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'mn', 'Том өгөгдөл', 'Уламжлалт хэрэгслээр боловсруулахад хэтэрхий их хэмжээний, хурдтай, олон төрлийн өгөгдлийн цуглуулга', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'big-data'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'mn');

  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'ja', 'ビッグデータ', '従来のデータ処理ソフトでは扱えない大規模・高速・多様なデータの集合', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'big-data'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'ja');

  -- Cloud Computing
  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'mn', 'Үүлэн тооцоолол', 'Интернэтээр дамжуулан серверс, хадгалалт, програм зэрэг тооцоолох нөөцийг эрэлтэд нийцүүлэн нийлүүлэх үйлчилгээ', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'cloud-computing'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'mn');

  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'ja', 'クラウドコンピューティング', 'インターネット経由でコンピュータリソースをオンデマンドで提供するサービスモデル', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'cloud-computing'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'ja');

  -- API
  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'mn', 'Програм хоорондын интерфэйс', 'Програм хангамжийн компонентууд хэрхэн харилцах талаар тодорхойлсон протокол буюу гэрээ', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'api'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'mn');

  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'ja', 'アプリケーションプログラミングインターフェース', 'ソフトウェア同士がどのように通信するかを定義した規約とツールのセット', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'api'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'ja');

  -- Recursion
  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'mn', 'Рекурс', 'Функц өөрийгөө дахин дуудаж асуудлыг жижиг дэд асуудалд задлан шийдэх програмчлалын арга', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'recursion'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'mn');

  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'ja', '再帰', '関数が自身を呼び出すことで問題をより小さなサブ問題に分解するプログラミング技法', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'recursion'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'ja');

  -- Object-Oriented Programming
  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'mn', 'Объект хандалтат програмчлал', 'Өгөгдөл болон аргуудыг объект хэлбэрээр зохион байгуулдаг, дахин ашиглах боломжтой програмчлалын парадигм', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'object-oriented-programming'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'mn');

  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'ja', 'オブジェクト指向プログラミング', 'データとメソッドをオブジェクトにまとめ、継承・ポリモーフィズム・カプセル化を活用するパラダイム', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'object-oriented-programming'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'ja');

  -- Data Structure
  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'mn', 'Өгөгдлийн бүтэц', 'Өгөгдлийг компьютерт үр дүнтэй хадгалж хандахад зориулсан зохион байгуулалтын арга', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'data-structure'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'mn');

  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'ja', 'データ構造', 'データを効率的に格納・操作するための編成方法。配列・リスト・木・グラフなど多様な種類がある', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'data-structure'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'ja');

  -- Binary Search
  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'mn', 'Хоёртын хайлт', 'Эрэмбэлэгдсэн массив дахь зорилтот утгыг хайлтын орон зайг хагасалж O(log n) хугацаанд олдог алгоритм', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'binary-search'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'mn');

  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'ja', '二分探索', 'ソート済み配列を半分ずつ絞り込み、O(log n)で目標値を見つける効率的な探索アルゴリズム', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'binary-search'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'ja');

  -- Hash Table
  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'mn', 'Хэш хүснэгт', 'Хэш функц ашиглан түлхүүрийг утгатай холбодог, дундажаар O(1) хугацааны өгөгдлийн бүтэц', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'hash-table'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'mn');

  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'ja', 'ハッシュテーブル', 'ハッシュ関数でキーを値にマッピングし、平均O(1)で挿入・削除・検索できるデータ構造', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'hash-table'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'ja');

  -- Stack
  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'mn', 'Стек', 'Сүүлд оруулсан элемент эхлэж гарах (LIFO) зарчмаар ажилладаг шугаман өгөгдлийн бүтэц', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'stack'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'mn');

  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'ja', 'スタック', '後入れ先出し（LIFO）原則で動作する線形データ構造。関数呼び出し管理に不可欠', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'stack'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'ja');

  -- Queue
  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'mn', 'Дараалал', 'Эхлэлд оруулсан элемент эхлэж гарах (FIFO) зарчмаар ажилладаг шугаман өгөгдлийн бүтэц', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'queue'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'mn');

  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'ja', 'キュー', '先入れ先出し（FIFO）原則で動作する線形データ構造。BFSやタスクスケジューリングに使用', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'queue'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'ja');

  -- Time Complexity
  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'mn', 'Цагийн нарийн төвөгтэй байдал', 'Алгоритмын гүйцэтгэх хугацаа оролтын хэмжээнээс хэрхэн хамааралтайг Big O тэмдэглэгээгээр илэрхийлэх хэмжүүр', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'time-complexity'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'mn');

  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'ja', '時間計算量', 'アルゴリズムの実行時間が入力サイズに対してどう増加するかをBig O記法で表す指標', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'time-complexity'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'ja');

  -- Agile
  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'mn', 'Хурдан хөгжүүлэлт', 'Богино спринтэд ажиллаж байнга үнэлж, загварчлан, харилцагчийн санал хүсэлтэд хурдан хариулдаг програм хангамж хөгжүүлэлтийн арга', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'agile'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'mn');

  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'ja', 'アジャイル', '短いスプリントで反復的に開発し、顧客フィードバックを取り込みながら変化に柔軟に対応する開発手法', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'agile'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'ja');

  -- Microservices
  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'mn', 'Микросервис', 'Програм хангамжийг жижиг, бие даасан, тус тусдаа ажилладаг үйлчилгээнүүдэд задлах аркитектурын загвар', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'microservices'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'mn');

  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'ja', 'マイクロサービス', 'アプリを小さな独立サービスに分割し、各サービスが独自のDBを持ちAPIで通信するアーキテクチャパターン', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'microservices'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'ja');

  -- DevOps
  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'mn', 'ДевОпс', 'Програм хөгжүүлэлт болон IT үйл ажиллагааг нэгтгэж байнгын хүргэлт, автоматжуулалтыг хэрэгжүүлдэг соёл, практик', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'devops'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'mn');

  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'ja', 'デブオプス', '開発（Dev）と運用（Ops）を統合してCI/CDや自動化により高品質なソフトウェアを継続的に届ける文化と実践', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'devops'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'ja');

  -- TypeScript
  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'mn', 'Тайпскрипт', 'Microsoft-ийн боловсруулсан, статик төрлийн систем нэмж, JavaScript-ийн алдааг эмхэтгэлийн үед илрүүлдэг өргөтгөл хэл', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'typescript'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'mn');

  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'ja', 'タイプスクリプト', 'Microsoftが開発したJavaScriptの静的型付けスーパーセット。コンパイル時に型エラーを検出し開発効率を向上', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'typescript'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'ja');

  -- Version Control
  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'mn', 'Хувилбар хяналт', 'Файлын өөрчлөлтийг цаг хугацааны дагуу бүртгэж, өмнөх хувилбар руу буцах, хамтран ажиллах боломжийг олгодог систем', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'version-control'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'mn');

  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'ja', 'バージョン管理', 'ファイルの変更履歴を記録し、以前のバージョンへの復元やチーム協業・ブランチ管理を可能にするシステム', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'version-control'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'ja');

  -- ══════════════════════════════════════════════════════════════════════════
  -- 6. TRANSLATIONS — Japanese-primary entries → EN + MN
  -- ══════════════════════════════════════════════════════════════════════════

  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'en', 'Software Engineering', 'Systematic application of engineering principles to the design, development, testing, and maintenance of software', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'software-engineering-ja'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'en');

  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'mn', 'Програм хангамж инженерчлэл', NULL, v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'software-engineering-ja'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'mn');

  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'en', 'Digital Transformation', 'Fundamental reinvention of business processes, models, and culture through the adoption of digital technology', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'digital-transformation'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'en');

  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'mn', 'Дижитал хувиралт', NULL, v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'digital-transformation'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'mn');

  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'en', 'Open Source', 'Software whose source code is publicly available for anyone to view, modify, and distribute freely', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'open-source'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'en');

  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'mn', 'Нээлттэй эхийн код', NULL, v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'open-source'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'mn');

  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'en', 'Programming Language', 'A formal language with defined syntax used to write instructions that a computer can execute', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'programming-language'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'en');

  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'mn', 'Програмчлалын хэл', NULL, v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'programming-language'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'mn');

  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'en', 'Cybersecurity', 'Practice of protecting systems, networks, and programs from digital attacks and unauthorized access', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'cybersecurity'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'en');

  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'mn', 'Кибер аюулгүй байдал', NULL, v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'cybersecurity'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'mn');

  -- ══════════════════════════════════════════════════════════════════════════
  -- 7. TRANSLATIONS — Mongolian-primary entries → EN + JA
  -- ══════════════════════════════════════════════════════════════════════════

  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'en', 'Software', 'Programs, data, and instructions that run on a computer system', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'software-mn'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'en');

  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'ja', 'ソフトウェア', NULL, v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'software-mn'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'ja');

  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'en', 'Information Security', 'Practices and processes for protecting information from unauthorized access, use, disclosure, or destruction', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'information-security'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'en');

  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'ja', '情報セキュリティ', NULL, v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'information-security'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'ja');

  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'en', 'Digital Technology', 'Technology that processes, stores, and transmits information in binary digital form', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'digital-technology'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'en');

  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'ja', 'デジタル技術', NULL, v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'digital-technology'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'ja');

  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'en', 'Database', 'An organized collection of structured information stored and accessed electronically', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'database-mn'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'en');

  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'ja', 'データベース', NULL, v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'database-mn'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'ja');

  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'en', 'Computer Network', 'A system of interconnected computers and devices that share resources and exchange data', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'computer-network'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'en');

  INSERT INTO public.dictionary_translations (entry_id, language_code, translated_term, explanation, created_by)
  SELECT e.id, 'ja', 'コンピュータネットワーク', NULL, v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'computer-network'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_translations t WHERE t.entry_id = e.id AND t.language_code = 'ja');

  -- ══════════════════════════════════════════════════════════════════════════
  -- 8. EXAMPLES  (1–2 per entry, varied languages)
  -- ══════════════════════════════════════════════════════════════════════════

  INSERT INTO public.dictionary_examples (entry_id, example_text, source, context, language_code, created_by)
  SELECT e.id,
    'Quicksort has an average-case time complexity of O(n log n), making it one of the fastest comparison-based sorting algorithms in practice.',
    'CLRS - Introduction to Algorithms', 'Sorting', 'en', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'algorithm'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_examples ex WHERE ex.entry_id = e.id AND ex.language_code = 'en');

  INSERT INTO public.dictionary_examples (entry_id, example_text, source, context, language_code, created_by)
  SELECT e.id,
    'Бинар хайлтын алгоритм нь 1 сая элементтэй эрэмбэлэгдсэн массиваас зорилтот утгыг ердөө 20 харьцуулалтаас доош хийж олно.',
    NULL, 'Алгоритмын гүйцэтгэлийн жишээ', 'mn', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'algorithm'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_examples ex WHERE ex.entry_id = e.id AND ex.language_code = 'mn');

  INSERT INTO public.dictionary_examples (entry_id, example_text, source, context, language_code, created_by)
  SELECT e.id,
    'Email spam filters use machine learning to classify incoming messages by training on millions of labeled spam/not-spam examples.',
    'Google ML Crash Course', 'Classification use case', 'en', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'machine-learning'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_examples ex WHERE ex.entry_id = e.id AND ex.language_code = 'en');

  INSERT INTO public.dictionary_examples (entry_id, example_text, source, context, language_code, created_by)
  SELECT e.id,
    'Netflix-ийн кино санал болгох систем таны үзэлтийн түүхийг машин сургалтаар задлан, ижил төстэй үзэгчдийн дуртай кинуудыг санал болгодог.',
    NULL, 'Бодит хэрэглээ', 'mn', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'machine-learning'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_examples ex WHERE ex.entry_id = e.id AND ex.language_code = 'mn');

  INSERT INTO public.dictionary_examples (entry_id, example_text, source, context, language_code, created_by)
  SELECT e.id,
    'GPT language models and DALL-E image generators are built on Transformer deep learning architectures with billions of trainable parameters.',
    'OpenAI Research', 'LLM applications', 'en', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'deep-learning'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_examples ex WHERE ex.entry_id = e.id AND ex.language_code = 'en');

  INSERT INTO public.dictionary_examples (entry_id, example_text, source, context, language_code, created_by)
  SELECT e.id,
    'When you use a weather app, it calls a weather API which returns JSON data containing temperature, humidity, and forecasts that the app then displays.',
    NULL, 'Everyday API usage', 'en', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'api'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_examples ex WHERE ex.entry_id = e.id AND ex.language_code = 'en');

  INSERT INTO public.dictionary_examples (entry_id, example_text, source, context, language_code, created_by)
  SELECT e.id,
    'factorial(5) calls factorial(4), which calls factorial(3) … down to factorial(0) = 1. Each call returns, unwinding the stack: 1×2×3×4×5 = 120.',
    NULL, 'Classic factorial recursion', 'en', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'recursion'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_examples ex WHERE ex.entry_id = e.id AND ex.language_code = 'en');

  INSERT INTO public.dictionary_examples (entry_id, example_text, source, context, language_code, created_by)
  SELECT e.id,
    'Searching for "python" in a sorted list of 1 million items takes at most 20 comparisons with binary search, versus up to 1,000,000 with linear search.',
    NULL, 'Performance comparison', 'en', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'binary-search'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_examples ex WHERE ex.entry_id = e.id AND ex.language_code = 'en');

  INSERT INTO public.dictionary_examples (entry_id, example_text, source, context, language_code, created_by)
  SELECT e.id,
    'JavaScript Objects, Python dictionaries, and Java HashMaps are all hash table implementations used daily to store key-value pairs with O(1) average lookup.',
    NULL, 'Language implementations', 'en', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'hash-table'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_examples ex WHERE ex.entry_id = e.id AND ex.language_code = 'en');

  INSERT INTO public.dictionary_examples (entry_id, example_text, source, context, language_code, created_by)
  SELECT e.id,
    'Every function call in JavaScript is pushed onto the call stack. Too many nested calls cause a "Maximum call stack size exceeded" error — a stack overflow.',
    NULL, 'JavaScript call stack', 'en', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'stack'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_examples ex WHERE ex.entry_id = e.id AND ex.language_code = 'en');

  INSERT INTO public.dictionary_examples (entry_id, example_text, source, context, language_code, created_by)
  SELECT e.id,
    'In Breadth-First Search (BFS), a queue ensures nodes are explored level by level — the shallowest nodes are always processed before deeper ones.',
    NULL, 'BFS graph traversal', 'en', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'queue'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_examples ex WHERE ex.entry_id = e.id AND ex.language_code = 'en');

  INSERT INTO public.dictionary_examples (entry_id, example_text, source, context, language_code, created_by)
  SELECT e.id,
    'Bubble sort is O(n²) — doubling the input quadruples the time. Merge sort is O(n log n) — much better. For 1M items the difference is ~500B vs ~20M operations.',
    NULL, 'Big O comparison', 'en', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'time-complexity'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_examples ex WHERE ex.entry_id = e.id AND ex.language_code = 'en');

  INSERT INTO public.dictionary_examples (entry_id, example_text, source, context, language_code, created_by)
  SELECT e.id,
    'Spotify engineering uses Agile 2-week sprints: plan on Monday, daily standups, deliver a testable feature by Friday, retrospect, and start the next cycle.',
    NULL, 'Agile in practice', 'en', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'agile'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_examples ex WHERE ex.entry_id = e.id AND ex.language_code = 'en');

  INSERT INTO public.dictionary_examples (entry_id, example_text, source, context, language_code, created_by)
  SELECT e.id,
    'Netflix decomposed its DVD monolith into 700+ microservices. The Payments service can be scaled independently of the Streaming service during peak hours.',
    'Netflix Tech Blog', 'Production microservices', 'en', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'microservices'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_examples ex WHERE ex.entry_id = e.id AND ex.language_code = 'en');

  INSERT INTO public.dictionary_examples (entry_id, example_text, source, context, language_code, created_by)
  SELECT e.id,
    'interface User { id: number; name: string; email: string; }  — TypeScript catches "user.emali" typos at compile time, before they reach production.',
    NULL, 'Type safety example', 'en', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'typescript'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_examples ex WHERE ex.entry_id = e.id AND ex.language_code = 'en');

  INSERT INTO public.dictionary_examples (entry_id, example_text, source, context, language_code, created_by)
  SELECT e.id,
    '"git commit -m ''fix: resolve null pointer in auth''" — each commit creates an immutable snapshot. "git revert HEAD" safely undoes the last commit without rewriting history.',
    NULL, 'Git workflow example', 'en', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'version-control'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_examples ex WHERE ex.entry_id = e.id AND ex.language_code = 'en');

  INSERT INTO public.dictionary_examples (entry_id, example_text, source, context, language_code, created_by)
  SELECT e.id,
    'フィッシング詐欺は攻撃者が正規の銀行を装ったメールを送り、偽サイトでログイン情報を入力させる典型的なサイバー攻撃の手口。',
    NULL, 'サイバー攻撃の例', 'ja', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'cybersecurity'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_examples ex WHERE ex.entry_id = e.id AND ex.language_code = 'ja');

  INSERT INTO public.dictionary_examples (entry_id, example_text, source, context, language_code, created_by)
  SELECT e.id,
    'Нийгмийн сүлжээний платформ хэрэглэгчийн профайл, нийтлэл, сэтгэгдэл, харилцааг PostgreSQL болон MongoDB гэх мэт өгөгдлийн санд хадгалдаг.',
    NULL, 'Практик хэрэглээ', 'mn', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'database-mn'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_examples ex WHERE ex.entry_id = e.id AND ex.language_code = 'mn');

  INSERT INTO public.dictionary_examples (entry_id, example_text, source, context, language_code, created_by)
  SELECT e.id,
    'Таны компьютер WiFi-аар чиглүүлэгч (router)-тэй холбогдох үед LAN үүсдэг. Интернет нь хоорондоо холбогдсон олон WAN-уудын нэгдэл юм.',
    NULL, 'Сүлжээний жишээ', 'mn', v_uid
  FROM public.dictionary_entries e WHERE e.slug = 'computer-network'
  AND NOT EXISTS (SELECT 1 FROM public.dictionary_examples ex WHERE ex.entry_id = e.id AND ex.language_code = 'mn');

  -- ══════════════════════════════════════════════════════════════════════════
  -- 9. INITIAL REVISIONS (status = approved, revision_number = 1)
  -- ══════════════════════════════════════════════════════════════════════════
  INSERT INTO public.dictionary_revisions
    (entry_id, revision_number, term, reading, language_code, definition,
     translations_snapshot, examples_snapshot, tags_snapshot,
     status, created_by, change_summary)
  SELECT
    e.id, 1, e.term, e.reading, e.language_code, e.definition,
    '[]'::jsonb, '[]'::jsonb, '[]'::jsonb,
    'approved', v_uid, 'Initial creation'
  FROM public.dictionary_entries e
  WHERE e.slug IN (
    'algorithm','machine-learning','deep-learning','neural-network','big-data',
    'cloud-computing','api','recursion','object-oriented-programming','data-structure',
    'binary-search','hash-table','stack','queue','time-complexity',
    'agile','microservices','devops','typescript','version-control',
    'software-engineering-ja','digital-transformation','open-source',
    'programming-language','cybersecurity',
    'software-mn','information-security','digital-technology','database-mn','computer-network'
  )
  ON CONFLICT (entry_id, revision_number) DO NOTHING;

  -- ══════════════════════════════════════════════════════════════════════════
  -- 10. LINK current_revision_id
  -- ══════════════════════════════════════════════════════════════════════════
  UPDATE public.dictionary_entries e
  SET current_revision_id = (
    SELECT r.id FROM public.dictionary_revisions r
    WHERE r.entry_id = e.id AND r.status = 'approved'
    ORDER BY r.revision_number DESC LIMIT 1
  )
  WHERE e.slug IN (
    'algorithm','machine-learning','deep-learning','neural-network','big-data',
    'cloud-computing','api','recursion','object-oriented-programming','data-structure',
    'binary-search','hash-table','stack','queue','time-complexity',
    'agile','microservices','devops','typescript','version-control',
    'software-engineering-ja','digital-transformation','open-source',
    'programming-language','cybersecurity',
    'software-mn','information-security','digital-technology','database-mn','computer-network'
  )
  AND e.current_revision_id IS NULL;

  -- ══════════════════════════════════════════════════════════════════════════
  -- 11. ENTRY TAGS
  -- ══════════════════════════════════════════════════════════════════════════
  INSERT INTO public.dictionary_entry_tags (entry_id, tag_id)
  SELECT e.id, t.id FROM public.dictionary_entries e, public.tags t
  WHERE e.slug = 'algorithm'               AND t.name IN ('algorithms','computer-science')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.dictionary_entry_tags (entry_id, tag_id)
  SELECT e.id, t.id FROM public.dictionary_entries e, public.tags t
  WHERE e.slug = 'machine-learning'        AND t.name IN ('machine-learning','artificial-intelligence','data-science')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.dictionary_entry_tags (entry_id, tag_id)
  SELECT e.id, t.id FROM public.dictionary_entries e, public.tags t
  WHERE e.slug = 'deep-learning'           AND t.name IN ('deep-learning','artificial-intelligence','neural-networks')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.dictionary_entry_tags (entry_id, tag_id)
  SELECT e.id, t.id FROM public.dictionary_entries e, public.tags t
  WHERE e.slug = 'neural-network'          AND t.name IN ('neural-networks','artificial-intelligence','machine-learning')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.dictionary_entry_tags (entry_id, tag_id)
  SELECT e.id, t.id FROM public.dictionary_entries e, public.tags t
  WHERE e.slug = 'big-data'               AND t.name IN ('big-data','data-science','databases')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.dictionary_entry_tags (entry_id, tag_id)
  SELECT e.id, t.id FROM public.dictionary_entries e, public.tags t
  WHERE e.slug = 'cloud-computing'        AND t.name IN ('cloud','infrastructure','devops')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.dictionary_entry_tags (entry_id, tag_id)
  SELECT e.id, t.id FROM public.dictionary_entries e, public.tags t
  WHERE e.slug = 'api'                    AND t.name IN ('programming','software-engineering','web-development')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.dictionary_entry_tags (entry_id, tag_id)
  SELECT e.id, t.id FROM public.dictionary_entries e, public.tags t
  WHERE e.slug = 'recursion'              AND t.name IN ('algorithms','programming','computer-science')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.dictionary_entry_tags (entry_id, tag_id)
  SELECT e.id, t.id FROM public.dictionary_entries e, public.tags t
  WHERE e.slug = 'object-oriented-programming' AND t.name IN ('programming','software-engineering','design-patterns')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.dictionary_entry_tags (entry_id, tag_id)
  SELECT e.id, t.id FROM public.dictionary_entries e, public.tags t
  WHERE e.slug = 'data-structure'         AND t.name IN ('data-structures','algorithms','computer-science')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.dictionary_entry_tags (entry_id, tag_id)
  SELECT e.id, t.id FROM public.dictionary_entries e, public.tags t
  WHERE e.slug = 'binary-search'          AND t.name IN ('algorithms','data-structures','computer-science')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.dictionary_entry_tags (entry_id, tag_id)
  SELECT e.id, t.id FROM public.dictionary_entries e, public.tags t
  WHERE e.slug = 'hash-table'             AND t.name IN ('data-structures','algorithms','performance')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.dictionary_entry_tags (entry_id, tag_id)
  SELECT e.id, t.id FROM public.dictionary_entries e, public.tags t
  WHERE e.slug = 'stack'                  AND t.name IN ('data-structures','algorithms','computer-science')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.dictionary_entry_tags (entry_id, tag_id)
  SELECT e.id, t.id FROM public.dictionary_entries e, public.tags t
  WHERE e.slug = 'queue'                  AND t.name IN ('data-structures','algorithms','computer-science')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.dictionary_entry_tags (entry_id, tag_id)
  SELECT e.id, t.id FROM public.dictionary_entries e, public.tags t
  WHERE e.slug = 'time-complexity'        AND t.name IN ('algorithms','computer-science','performance')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.dictionary_entry_tags (entry_id, tag_id)
  SELECT e.id, t.id FROM public.dictionary_entries e, public.tags t
  WHERE e.slug = 'agile'                  AND t.name IN ('agile','software-engineering','project-management')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.dictionary_entry_tags (entry_id, tag_id)
  SELECT e.id, t.id FROM public.dictionary_entries e, public.tags t
  WHERE e.slug = 'microservices'          AND t.name IN ('architecture','software-engineering','devops')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.dictionary_entry_tags (entry_id, tag_id)
  SELECT e.id, t.id FROM public.dictionary_entries e, public.tags t
  WHERE e.slug = 'devops'                 AND t.name IN ('devops','software-engineering','automation')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.dictionary_entry_tags (entry_id, tag_id)
  SELECT e.id, t.id FROM public.dictionary_entries e, public.tags t
  WHERE e.slug = 'typescript'             AND t.name IN ('typescript','javascript','programming')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.dictionary_entry_tags (entry_id, tag_id)
  SELECT e.id, t.id FROM public.dictionary_entries e, public.tags t
  WHERE e.slug = 'version-control'        AND t.name IN ('version-control','git','software-engineering')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.dictionary_entry_tags (entry_id, tag_id)
  SELECT e.id, t.id FROM public.dictionary_entries e, public.tags t
  WHERE e.slug = 'software-engineering-ja' AND t.name IN ('software-engineering','programming')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.dictionary_entry_tags (entry_id, tag_id)
  SELECT e.id, t.id FROM public.dictionary_entries e, public.tags t
  WHERE e.slug = 'digital-transformation' AND t.name IN ('digital','software-engineering')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.dictionary_entry_tags (entry_id, tag_id)
  SELECT e.id, t.id FROM public.dictionary_entries e, public.tags t
  WHERE e.slug = 'open-source'            AND t.name IN ('open-source','software-engineering','programming')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.dictionary_entry_tags (entry_id, tag_id)
  SELECT e.id, t.id FROM public.dictionary_entries e, public.tags t
  WHERE e.slug = 'programming-language'   AND t.name IN ('programming','computer-science')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.dictionary_entry_tags (entry_id, tag_id)
  SELECT e.id, t.id FROM public.dictionary_entries e, public.tags t
  WHERE e.slug = 'cybersecurity'          AND t.name IN ('security','networking')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.dictionary_entry_tags (entry_id, tag_id)
  SELECT e.id, t.id FROM public.dictionary_entries e, public.tags t
  WHERE e.slug = 'software-mn'            AND t.name IN ('software-engineering','programming')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.dictionary_entry_tags (entry_id, tag_id)
  SELECT e.id, t.id FROM public.dictionary_entries e, public.tags t
  WHERE e.slug = 'information-security'   AND t.name IN ('security','networking')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.dictionary_entry_tags (entry_id, tag_id)
  SELECT e.id, t.id FROM public.dictionary_entries e, public.tags t
  WHERE e.slug = 'digital-technology'     AND t.name IN ('digital','computer-science')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.dictionary_entry_tags (entry_id, tag_id)
  SELECT e.id, t.id FROM public.dictionary_entries e, public.tags t
  WHERE e.slug = 'database-mn'            AND t.name IN ('databases','data-structures')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.dictionary_entry_tags (entry_id, tag_id)
  SELECT e.id, t.id FROM public.dictionary_entries e, public.tags t
  WHERE e.slug = 'computer-network'       AND t.name IN ('networking','infrastructure')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '✓ Dictionary seed complete — 30 entries, ~60 translations, ~20 examples, 30 tags, 30 revisions.';
END $seed$;

-- ============================================================================
-- VERIFICATION — Run these SELECT queries to confirm the seed succeeded
-- ============================================================================
/*
SELECT
  e.slug,
  e.term,
  e.language_code,
  e.status,
  e.views,
  e.saves,
  COUNT(DISTINCT t.id) AS translations,
  COUNT(DISTINCT ex.id) AS examples,
  COUNT(DISTINCT et.tag_id) AS tags,
  COUNT(DISTINCT r.id) AS revisions
FROM public.dictionary_entries e
LEFT JOIN public.dictionary_translations t ON t.entry_id = e.id
LEFT JOIN public.dictionary_examples ex ON ex.entry_id = e.id
LEFT JOIN public.dictionary_entry_tags et ON et.entry_id = e.id
LEFT JOIN public.dictionary_revisions r ON r.entry_id = e.id
GROUP BY e.id, e.slug, e.term, e.language_code, e.status, e.views, e.saves
ORDER BY e.slug;
*/
