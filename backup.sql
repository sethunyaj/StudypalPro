--
-- PostgreSQL database dump
--

\restrict hKqcsDRGKKzJg0SqBTBOKBJXUhtWAJU8ZVVqaKilnhsKrtpxDKWMqCEUD4Eq1U4

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: achievements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.achievements (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    icon text NOT NULL,
    unlocked_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.achievements OWNER TO postgres;

--
-- Name: class_enrollments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.class_enrollments (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    class_id text NOT NULL,
    student_id text NOT NULL,
    enrolled_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.class_enrollments OWNER TO postgres;

--
-- Name: class_resources; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.class_resources (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    class_id text NOT NULL,
    title text NOT NULL,
    description text,
    type text NOT NULL,
    url text,
    content text,
    topic text,
    uploaded_by text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    file_name text,
    file_path text,
    file_size integer
);


ALTER TABLE public.class_resources OWNER TO postgres;

--
-- Name: classes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.classes (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    subject text NOT NULL,
    teacher_id text NOT NULL,
    code text NOT NULL,
    color text DEFAULT 'bg-primary'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.classes OWNER TO postgres;

--
-- Name: exams; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.exams (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    class_id text NOT NULL,
    title text NOT NULL,
    description text,
    date timestamp without time zone NOT NULL,
    topics text[],
    created_by text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    attachments text[]
);


ALTER TABLE public.exams OWNER TO postgres;

--
-- Name: flashcards; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.flashcards (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    front text NOT NULL,
    back text NOT NULL,
    subject text,
    tags text[],
    ease_factor integer DEFAULT 2500 NOT NULL,
    "interval" integer DEFAULT 0 NOT NULL,
    repetitions integer DEFAULT 0 NOT NULL,
    next_review_date timestamp without time zone DEFAULT now() NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.flashcards OWNER TO postgres;

--
-- Name: group_announcements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.group_announcements (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    group_id text NOT NULL,
    user_id text NOT NULL,
    user_name text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    pinned boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.group_announcements OWNER TO postgres;

--
-- Name: group_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.group_messages (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    group_id text NOT NULL,
    user_id text NOT NULL,
    user_name text NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.group_messages OWNER TO postgres;

--
-- Name: group_notes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.group_notes (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    group_id text NOT NULL,
    user_id text NOT NULL,
    user_name text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.group_notes OWNER TO postgres;

--
-- Name: mind_maps; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mind_maps (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    title text NOT NULL,
    subject text,
    nodes jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.mind_maps OWNER TO postgres;

--
-- Name: news_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.news_comments (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    post_id text NOT NULL,
    user_id text NOT NULL,
    user_name text NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.news_comments OWNER TO postgres;

--
-- Name: news_likes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.news_likes (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    post_id text NOT NULL,
    user_id text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.news_likes OWNER TO postgres;

--
-- Name: news_posts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.news_posts (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    body text,
    image_url text,
    attachment_url text,
    attachment_name text,
    video_url text,
    video_provider text,
    author_name text NOT NULL,
    author_role text NOT NULL,
    author_id text NOT NULL,
    status text DEFAULT 'published'::text NOT NULL,
    scheduled_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    video_orientation text DEFAULT 'landscape'::text
);


ALTER TABLE public.news_posts OWNER TO postgres;

--
-- Name: notes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notes (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    subject text,
    tags text[],
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notes OWNER TO postgres;

--
-- Name: platform_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.platform_settings (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    value text,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.platform_settings OWNER TO postgres;

--
-- Name: quiz_attempts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quiz_attempts (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    quiz_id text NOT NULL,
    score integer NOT NULL,
    total_questions integer NOT NULL,
    answers jsonb NOT NULL,
    time_spent integer NOT NULL,
    completed_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.quiz_attempts OWNER TO postgres;

--
-- Name: quizzes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quizzes (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    title text NOT NULL,
    subject text NOT NULL,
    difficulty text NOT NULL,
    questions jsonb NOT NULL,
    source_note_id text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    class_id text
);


ALTER TABLE public.quizzes OWNER TO postgres;

--
-- Name: study_groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.study_groups (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    subject text,
    creator_id text NOT NULL,
    member_ids text[] DEFAULT ARRAY[]::text[] NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    code character varying(6) NOT NULL
);


ALTER TABLE public.study_groups OWNER TO postgres;

--
-- Name: study_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.study_sessions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    subject text,
    duration integer NOT NULL,
    type text NOT NULL,
    completed_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.study_sessions OWNER TO postgres;

--
-- Name: support_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.support_messages (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    sender_id text NOT NULL,
    sender_role text NOT NULL,
    message text NOT NULL,
    read boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.support_messages OWNER TO postgres;

--
-- Name: teacher_quiz_attempts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teacher_quiz_attempts (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    quiz_id text NOT NULL,
    student_id text NOT NULL,
    answers jsonb NOT NULL,
    auto_score integer DEFAULT 0 NOT NULL,
    manual_score integer,
    total_score integer,
    status text DEFAULT 'submitted'::text NOT NULL,
    time_spent integer NOT NULL,
    graded_by text,
    graded_at timestamp without time zone,
    submitted_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.teacher_quiz_attempts OWNER TO postgres;

--
-- Name: teacher_quizzes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teacher_quizzes (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    class_id text NOT NULL,
    teacher_id text NOT NULL,
    title text NOT NULL,
    description text,
    questions jsonb NOT NULL,
    time_limit integer,
    passing_score integer,
    total_points integer NOT NULL,
    is_published boolean DEFAULT false NOT NULL,
    due_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.teacher_quizzes OWNER TO postgres;

--
-- Name: todos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.todos (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    class_id text NOT NULL,
    title text NOT NULL,
    description text,
    due_date timestamp without time zone,
    resource_link text,
    created_by text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.todos OWNER TO postgres;

--
-- Name: training_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.training_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    topic_id text,
    type text NOT NULL,
    title text NOT NULL,
    description text,
    content text,
    attachment_url text,
    attachment_name text,
    status text DEFAULT 'draft'::text NOT NULL,
    created_by text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    video_url text,
    attachment_path text,
    questions jsonb
);


ALTER TABLE public.training_items OWNER TO postgres;

--
-- Name: training_progress; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.training_progress (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    item_id text NOT NULL,
    completed boolean DEFAULT false NOT NULL,
    completed_at timestamp without time zone
);


ALTER TABLE public.training_progress OWNER TO postgres;

--
-- Name: training_quiz_attempts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.training_quiz_attempts (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    item_id text NOT NULL,
    answers jsonb NOT NULL,
    score integer NOT NULL,
    total_questions integer NOT NULL,
    completed_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.training_quiz_attempts OWNER TO postgres;

--
-- Name: training_topics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.training_topics (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    created_by text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.training_topics OWNER TO postgres;

--
-- Name: tutor_conversations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tutor_conversations (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    messages jsonb NOT NULL,
    subject text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.tutor_conversations OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    name text NOT NULL,
    role text DEFAULT 'student'::text NOT NULL,
    grade text,
    points integer DEFAULT 0 NOT NULL,
    streak integer DEFAULT 0 NOT NULL,
    level integer DEFAULT 1 NOT NULL,
    xp integer DEFAULT 0 NOT NULL,
    last_login_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Data for Name: achievements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.achievements (id, user_id, type, title, description, icon, unlocked_at) FROM stdin;
\.


--
-- Data for Name: class_enrollments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.class_enrollments (id, class_id, student_id, enrolled_at) FROM stdin;
cf038649-a1bc-4007-a984-6a6f6b3f9dc8	56735025-afaf-417d-88b0-cefca0c40b7f	4a152f5d-c3da-48ac-8465-162e9be13e0d	2025-11-30 18:28:55.413342
b3288472-bc02-4281-b4a2-d9aa4bf0f6c0	b0661262-f2fb-4163-8db2-e48c1f0fc31b	79991994-983b-4ae3-a9b2-4d165805e751	2025-11-30 18:38:24.726166
a76686c0-2696-427c-bbe6-bfa31136eb27	f3b179d9-f68c-4e67-88a8-b12b49dd8a5c	c7129cee-987a-4c13-8372-0df9817e06fc	2025-12-06 15:15:11.036646
\.


--
-- Data for Name: class_resources; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.class_resources (id, class_id, title, description, type, url, content, topic, uploaded_by, created_at, file_name, file_path, file_size) FROM stdin;
2a7bddab-6d66-493d-959e-a843588fa62f	56735025-afaf-417d-88b0-cefca0c40b7f	Guide		link	https://example.com	\N	\N	2444116a-be14-4701-a8bd-aaccd99744c3	2025-11-30 18:26:44.555794	\N	\N	\N
c8806d8b-ce3b-4436-ab8b-3f587aac7ebf	be2f2230-f2de-4e68-8f9b-da0d0e664d74	Test Document		file	\N	\N	\N	d215c89c-04e5-4133-ba1b-7b4e5357c3f9	2025-11-30 21:11:11.172407	test-document.pdf	/api/files/uploads/31eb4198-7c75-4101-be12-85ae329eca74.pdf	26
2c9314f5-e773-402a-b120-bd2513cf4651	be2f2230-f2de-4e68-8f9b-da0d0e664d74	Security Test File 0g5F		file	\N	\N	\N	d215c89c-04e5-4133-ba1b-7b4e5357c3f9	2025-11-30 21:20:30.021323	test-file.pdf	/api/files/uploads/e2b11722-3e7c-464b-8880-894c9d9775fb.pdf	16
275bd8e5-5896-4a72-b70c-136a3018db78	be2f2230-f2de-4e68-8f9b-da0d0e664d74	Final Upload Test 8GWZ		file	\N	\N	\N	d215c89c-04e5-4133-ba1b-7b4e5357c3f9	2025-11-30 21:28:49.687521	test-upload.pdf	/api/files/uploads/96ec6317-b226-48d6-8a2e-2ab4e7f4d662.pdf	545
\.


--
-- Data for Name: classes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.classes (id, name, description, subject, teacher_id, code, color, created_at) FROM stdin;
04403f75-34bc-46b3-aa6b-318c7b55aeab	Test Biology L6Ki	A test class for biology	Biology	aa5f49fa-4c32-4097-86ad-4780aaf2937d	WOPXQK	bg-primary	2025-11-30 18:09:21.135686
56735025-afaf-417d-88b0-cefca0c40b7f	BiologyGbf	Biology class	Biology	2444116a-be14-4701-a8bd-aaccd99744c3	8UO9VY	bg-primary	2025-11-30 18:23:15.842714
b0661262-f2fb-4163-8db2-e48c1f0fc31b	stAGE1	ONE	ICT	d215c89c-04e5-4133-ba1b-7b4e5357c3f9	MIOJWN	bg-chart-2	2025-11-30 18:36:34.632912
284f90bc-41d1-4d4c-82a4-86d7afbd83ae	Test Biology Class		Biology	741590b2-7cc4-434e-b087-ff5fa4891606	FTUSU3	bg-primary	2025-11-30 19:54:22.390431
be2f2230-f2de-4e68-8f9b-da0d0e664d74	Test Class ySct	File upload test	Test Subject	d215c89c-04e5-4133-ba1b-7b4e5357c3f9	1QN1HL	bg-primary	2025-11-30 21:08:56.684867
8b4eee4a-d29a-46dc-a9a8-26fac574768b	Quiz Test Class a2yQBk		Science	b7121fb1-0d33-4c5c-a69b-2278c4f622d6	06CYQG	bg-primary	2025-12-06 15:08:13.073239
f3b179d9-f68c-4e67-88a8-b12b49dd8a5c	Student Quiz Test _-PnPO		Math	9976e7d1-3246-46ec-bd4d-b31ec7a7ed03	GJUWLJ	bg-primary	2025-12-06 15:11:49.751519
\.


--
-- Data for Name: exams; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.exams (id, class_id, title, description, date, topics, created_by, created_at, attachments) FROM stdin;
0c630850-fa18-41f4-8cfc-1e3d586170a3	56735025-afaf-417d-88b0-cefca0c40b7f	Midterm		2025-12-01 12:00:00	{Genetics}	2444116a-be14-4701-a8bd-aaccd99744c3	2025-11-30 18:25:47.308977	\N
15ab48d4-5619-416f-aae6-5bb151404c4f	be2f2230-f2de-4e68-8f9b-da0d0e664d74	Math Final -ZAb		2025-12-01 21:13:00	{Mathematics}	d215c89c-04e5-4133-ba1b-7b4e5357c3f9	2025-11-30 21:15:34.377524	{"{\\"name\\":\\"exam-paper.pdf\\",\\"size\\":662,\\"path\\":\\"/api/files/uploads/13e1165a-2d7e-4b0b-b087-47b3e095a495.pdf\\"}"}
\.


--
-- Data for Name: flashcards; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.flashcards (id, user_id, front, back, subject, tags, ease_factor, "interval", repetitions, next_review_date, created_at) FROM stdin;
5c50f6e3-e80e-4528-a492-961b5fac6154	8a5a53b7-a496-42ec-a023-6a3bde9e8207	What	aw	Biology	{Chapter5}	2500	0	0	2025-11-04 17:51:02.200343	2025-11-04 17:51:02.200343
\.


--
-- Data for Name: group_announcements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.group_announcements (id, group_id, user_id, user_name, title, content, pinned, created_at) FROM stdin;
a3692488-ebf9-4dcf-9b64-8f57b99d34e6	c40fc848-916c-4e90-b224-fbea5b0bf093	79991994-983b-4ae3-a9b2-4d165805e751	Demo Student	Important Update	This is a test announcement	f	2026-02-05 16:45:13.532113
\.


--
-- Data for Name: group_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.group_messages (id, group_id, user_id, user_name, content, created_at) FROM stdin;
03602959-e1f9-447c-bacc-5e4c8bf50989	c40fc848-916c-4e90-b224-fbea5b0bf093	79991994-983b-4ae3-a9b2-4d165805e751	Demo Student	Hello, this is a test message	2026-02-05 16:43:50.050347
c08af953-4460-4c23-9cf0-b214784c3a85	b7746926-568f-4858-813e-b7f0446b9d27	79991994-983b-4ae3-a9b2-4d165805e751	Demo Student	Hey you guys	2026-02-05 16:53:39.312799
\.


--
-- Data for Name: group_notes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.group_notes (id, group_id, user_id, user_name, title, content, created_at, updated_at) FROM stdin;
3cf533ed-3e2a-4545-a5fa-28a3c88ba37e	c40fc848-916c-4e90-b224-fbea5b0bf093	79991994-983b-4ae3-a9b2-4d165805e751	Demo Student	Test Note Title	This is test note content for studying	2026-02-05 16:44:43.866883	2026-02-05 16:44:43.866883
\.


--
-- Data for Name: mind_maps; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.mind_maps (id, user_id, title, subject, nodes, created_at, updated_at) FROM stdin;
12968609-f29e-484a-abfd-1643f1f18d47	1c2c9228-bcf5-46e9-9076-9dd12720e236	Biology Chapter 5	\N	{"edges": [{"id": "edge_1770615153130", "to": "node_1770615153130", "from": "root"}], "nodes": [{"x": 0, "y": 0, "id": "root", "text": "Main Topic", "color": "#1e293b", "width": 180, "height": 56, "parentId": null}, {"x": 155.56349186104046, "y": -155.56349186104043, "id": "node_1770615153130", "text": "New Idea", "color": "#3b82f6", "width": 140, "height": 44, "parentId": "root"}]}	2026-02-09 05:32:40.249088	2026-02-09 05:32:40.249088
51d6ac26-d571-472b-805f-97aacd5af99b	1c2c9228-bcf5-46e9-9076-9dd12720e236	Test Mind Map 1770616425169	\N	{"edges": [{"id": "edge_1770616444345", "to": "node_1770616444345", "from": "root"}], "nodes": [{"x": 0, "y": 0, "id": "root", "text": "Main Topic", "color": "#1e293b", "width": 180, "height": 56, "parentId": null}, {"x": 155.56349186104046, "y": -155.56349186104043, "id": "node_1770616444345", "text": "New Idea", "color": "#3b82f6", "width": 140, "height": 44, "parentId": "root"}]}	2026-02-09 05:54:14.972487	2026-02-09 05:54:14.972487
\.


--
-- Data for Name: news_comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.news_comments (id, post_id, user_id, user_name, content, created_at) FROM stdin;
68811e3e-fec3-432f-909c-157f6c916a4c	fce9a3d1-367b-41ec-98c1-01ee4707ab53	1c2c9228-bcf5-46e9-9076-9dd12720e236	Administrator	Great newsletter!	2026-03-05 06:38:02.924284
\.


--
-- Data for Name: news_likes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.news_likes (id, post_id, user_id, created_at) FROM stdin;
0f6cb47a-a8e9-46d1-bc23-c4d3cf3b6a61	fce9a3d1-367b-41ec-98c1-01ee4707ab53	1c2c9228-bcf5-46e9-9076-9dd12720e236	2026-03-05 06:37:37.944389
\.


--
-- Data for Name: news_posts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.news_posts (id, type, title, body, image_url, attachment_url, attachment_name, video_url, video_provider, author_name, author_role, author_id, status, scheduled_at, created_at, video_orientation) FROM stdin;
fce9a3d1-367b-41ec-98c1-01ee4707ab53	newsletter	Test Newsletter Post	This is a test newsletter body content for our first post.	\N	\N	\N	\N	\N	Administrator	CEO	1c2c9228-bcf5-46e9-9076-9dd12720e236	published	\N	2026-03-05 06:37:31.757037	landscape
f68f3b21-6930-4357-8d99-418b2b5e9792	video	CEO Welcome Message	Welcome to our platform!	\N	\N	\N	https://www.youtube.com/watch?v=dQw4w9WgXcQ	youtube	Administrator	CEO	1c2c9228-bcf5-46e9-9076-9dd12720e236	published	\N	2026-03-05 06:38:34.182721	landscape
\.


--
-- Data for Name: notes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notes (id, user_id, title, content, subject, tags, created_at, updated_at) FROM stdin;
db5cf8fe-f475-4dbf-9379-99c22bcf7270	eacfbc92-4089-4c34-9e12-63fa5be07036	Biology Chapter 1: Cell Structure	Prokaryotes lack nucleus. Eukaryotes have nucleus and organelles.	Cell Biology	{cells,biology,chapter1}	2025-11-04 17:42:11.284433	2025-11-04 17:42:11.284433
557e5535-a80c-4b0e-9a02-3f91baee740f	8a5a53b7-a496-42ec-a023-6a3bde9e8207	Maths	hellooooo	What	{}	2025-11-04 17:50:41.323239	2025-11-04 17:50:41.323239
92a0125a-0346-4646-8eb5-99595bafffbb	79991994-983b-4ae3-a9b2-4d165805e751	Photosynthesis	Photosynthesis is the process by which plants convert sunlight, water, and carbon dioxide into glucose and oxygen. It occurs in the chloroplasts, primarily in the leaves. The light-dependent reactions happen in the thylakoid membrane and produce ATP and NADPH. The Calvin cycle uses these to fix carbon dioxide into glucose.	Biology	{biology,chapter3}	2026-03-12 05:27:00.232538	2026-03-12 05:27:00.232538
\.


--
-- Data for Name: platform_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.platform_settings (id, key, value, updated_at) FROM stdin;
2fdd7af0-04e0-48a4-9fab-b796a00bbcf9	fastbots_enabled	true	2025-11-04 19:28:27.736
efe45ecd-3ee6-48b3-9c6b-3d558ef7691c	fastbots_bot_id	<iframe\tstyle="width: 400px; height: 600px;" src="https://app.fastbots.ai/embed/cm7aktk8p05fjsvk4h9oxg9bf"></iframe>	2025-11-04 19:28:28.218
\.


--
-- Data for Name: quiz_attempts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quiz_attempts (id, user_id, quiz_id, score, total_questions, answers, time_spent, completed_at) FROM stdin;
\.


--
-- Data for Name: quizzes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quizzes (id, user_id, title, subject, difficulty, questions, source_note_id, created_at, class_id) FROM stdin;
9d622116-328d-4429-80ce-3bea68fd9519	9503da73-a397-4550-9eff-bdc8a83c8828	World History - Easy	World History	easy	[{"id": "q_1762287035966_0", "type": "multiple_choice", "options": ["Johannes Gutenberg", "Leonardo da Vinci", "Galileo Galilei", "Martin Luther"], "question": "Who is credited with introducing the movable-type printing press to Europe in the 15th century?", "difficulty": "easy", "explanation": "Johannes Gutenberg developed the movable-type printing press in the mid-1400s in Mainz, Germany. His invention greatly increased the availability of books, helped spread ideas, and is considered a major driver of the Renaissance and Reformation.", "correctAnswer": "Johannes Gutenberg"}, {"id": "q_1762287035966_1", "type": "true_false", "question": "The Great Wall of China was primarily built to protect Chinese states from invasions coming from the north.", "difficulty": "easy", "explanation": "The Great Wall was constructed and expanded over centuries, especially during the Qin and Ming dynasties, to defend against nomadic groups from the northern steppes, such as the Xiongnu and later the Mongols.", "correctAnswer": "True"}, {"id": "q_1762287035966_2", "type": "fill_blank", "question": "Christopher Columbus’s first voyage across the Atlantic in _____ is often cited as opening sustained contact between Europe and the Americas.", "difficulty": "easy", "explanation": "Columbus sailed under the Spanish crown in 1492, reaching Caribbean islands. While not the first to reach the Americas, his voyage led to ongoing European exploration and colonization.", "correctAnswer": "1492"}, {"id": "q_1762287035966_3", "type": "multiple_choice", "options": ["Ancient Egyptians", "Romans", "Mayans", "Greeks"], "question": "Which ancient civilization built the famous pyramids at Giza?", "difficulty": "easy", "explanation": "The pyramids at Giza were constructed during Egypt’s Old Kingdom, notably the Great Pyramid built for Pharaoh Khufu. While other cultures built pyramid-like structures, the Giza pyramids are Egyptian.", "correctAnswer": "Ancient Egyptians"}, {"id": "q_1762287035966_4", "type": "short_answer", "question": "What 1215 document signed by King John of England limited the power of the monarchy and affirmed certain legal rights?", "difficulty": "easy", "explanation": "The Magna Carta, or \\"Great Charter,\\" was agreed to by King John in 1215. It established the principle that the king was subject to the law and protected certain rights, influencing later constitutional traditions.", "correctAnswer": "Magna Carta"}]	none	2025-11-04 20:10:36.25483	\N
e1b31531-f92b-4679-90fa-bca4a2e90e03	782db9e0-0a4b-430e-81d8-f2f5f80d6475	Science Basics - Easy	Science Basics	easy	[{"id": "q_1762287299155_0", "type": "multiple_choice", "options": ["Nitrogen", "Oxygen", "Carbon dioxide", "Helium"], "question": "Which gas is essential for human respiration?", "difficulty": "easy", "explanation": "Humans need oxygen to release energy from food in a process called cellular respiration. While nitrogen makes up most of the air, it is not used by our bodies in respiration. Carbon dioxide is a waste gas that we exhale, and helium is inert and not used by the body.", "correctAnswer": "Oxygen"}, {"id": "q_1762287299155_1", "type": "true_false", "question": "The Earth revolves around the Sun.", "difficulty": "easy", "explanation": "Earth orbits the Sun once every year. This motion, together with the Earth's tilt, causes the seasons. The Sun does not revolve around the Earth; that idea was replaced by the heliocentric model of the solar system.", "correctAnswer": "True"}, {"id": "q_1762287299155_2", "type": "fill_blank", "question": "Water freezes at ___ degrees Celsius.", "difficulty": "easy", "explanation": "At standard atmospheric pressure, pure water changes from liquid to solid at 0°C (32°F). This temperature marks the freezing/melting point for water.", "correctAnswer": "0"}, {"id": "q_1762287299155_3", "type": "short_answer", "question": "Name the three common states of matter.", "difficulty": "easy", "explanation": "The most familiar states of matter are solid (fixed shape and volume), liquid (fixed volume but variable shape), and gas (variable shape and volume). Other states exist, like plasma, but these three are the basics encountered in everyday life.", "correctAnswer": "solid, liquid, gas"}, {"id": "q_1762287299155_4", "type": "multiple_choice", "options": ["Brain", "Lungs", "Heart", "Stomach"], "question": "Which organ pumps blood through the human body?", "difficulty": "easy", "explanation": "The heart is a muscular organ that pumps blood, delivering oxygen and nutrients to tissues and removing waste products. The brain controls body functions, the lungs exchange gases, and the stomach helps digest food.", "correctAnswer": "Heart"}]	none	2025-11-04 20:15:01.820105	\N
6b8d35c4-ad20-413c-ba66-e52350c07aaf	79991994-983b-4ae3-a9b2-4d165805e751	Simple Math - Easy	Simple Math	easy	[{"id": "q_1762287896068_0", "type": "multiple_choice", "options": ["11", "12", "13", "10"], "question": "What is 7 + 5?", "difficulty": "easy", "explanation": "Adding 7 and 5 gives 12. You can think of 7 + 5 as 7 + 3 + 2 = 10 + 2 = 12.", "correctAnswer": "12"}, {"id": "q_1762287896068_1", "type": "true_false", "question": "Zero is an even number.", "difficulty": "easy", "explanation": "An even number is any whole number divisible by 2 with no remainder. Since 0 = 2 × 0, zero is even.", "correctAnswer": "True"}, {"id": "q_1762287896068_2", "type": "fill_blank", "question": "15 - __ = 9", "difficulty": "easy", "explanation": "To find the missing number, think: 15 minus what equals 9? Subtract 9 from 15: 15 - 9 = 6. So 15 - 6 = 9.", "correctAnswer": "6"}, {"id": "q_1762287896068_3", "type": "short_answer", "question": "What is the next number in the sequence: 2, 4, 6, 8, __?", "difficulty": "easy", "explanation": "The pattern increases by 2 each time (counting by twos). After 8 comes 10.", "correctAnswer": "10"}, {"id": "q_1762287896068_4", "type": "multiple_choice", "options": ["3", "5", "4", "2"], "question": "Which number is the greatest?", "difficulty": "easy", "explanation": "Comparing the values, 5 is larger than 2, 3, and 4, so it is the greatest.", "correctAnswer": "5"}]	none	2025-11-04 20:24:58.698467	\N
c04b6c61-62bb-49a6-94f0-ce09d5aab979	79991994-983b-4ae3-a9b2-4d165805e751	Basic Math - Easy	Basic Math	easy	[{"id": "q_1762323550644_0", "type": "multiple_choice", "options": ["10", "11", "12", "13"], "question": "What is 7 + 5?", "difficulty": "easy", "explanation": "Adding 7 and 5 gives 12. You can think of it as 7 + 3 = 10, then add the remaining 2 to get 12.", "correctAnswer": "12"}, {"id": "q_1762323550644_1", "type": "true_false", "question": "Zero is an even number.", "difficulty": "easy", "explanation": "An even number is any integer divisible by 2. Since 0 ÷ 2 = 0 with no remainder, 0 is even.", "correctAnswer": "True"}, {"id": "q_1762323550644_2", "type": "fill_blank", "question": "___ is the product of 3 and 4.", "difficulty": "easy", "explanation": "The product means the result of multiplication. 3 × 4 = 12, which you can see as 4 added three times (4 + 4 + 4).", "correctAnswer": "12"}, {"id": "q_1762323550644_3", "type": "short_answer", "question": "What is the value of 9 − 6?", "difficulty": "easy", "explanation": "Subtraction finds the difference. Starting at 9 and taking away 6 leaves 3 (9 − 6 = 3).", "correctAnswer": "3"}, {"id": "q_1762323550644_4", "type": "multiple_choice", "options": ["2/4", "3/8", "1/3", "2/5"], "question": "Which fraction is equal to one half?", "difficulty": "easy", "explanation": "Fractions are equivalent if you multiply or divide the numerator and denominator by the same number. 2/4 simplifies to 1/2 by dividing both top and bottom by 2.", "correctAnswer": "2/4"}]	none	2025-11-05 06:19:10.935197	\N
19b957b8-e730-452c-9260-93dca07d475a	79991994-983b-4ae3-a9b2-4d165805e751	Simple Addition - Easy	Simple Addition	easy	[{"id": "q_1762323811001_0", "type": "multiple_choice", "options": ["11", "12", "13", "14"], "question": "What is 7 + 5?", "difficulty": "easy", "explanation": "Start at 7 and count on 5: 8, 9, 10, 11, 12. You can also use the commutative property (7 + 5 = 5 + 7) and think 5 + 7 = 12.", "correctAnswer": "12"}, {"id": "q_1762323811001_1", "type": "true_false", "question": "True or False: 3 + 4 equals 8.", "difficulty": "easy", "explanation": "3 + 4 equals 7, not 8. Counting on from 3: 4, 5, 6, 7 shows the correct total.", "correctAnswer": "False"}, {"id": "q_1762323811001_2", "type": "fill_blank", "question": "Fill in the blank: 5 + __ = 9", "difficulty": "easy", "explanation": "To reach 9 from 5, you need 4 more because 5 + 4 = 9. This is a missing addend problem: 9 − 5 = 4.", "correctAnswer": "4"}, {"id": "q_1762323811001_3", "type": "short_answer", "question": "What is 12 + 6?", "difficulty": "easy", "explanation": "Count on 6 from 12: 13, 14, 15, 16, 17, 18. Another way: 12 needs 8 to reach 20, so adding 6 gets you to 18.", "correctAnswer": "18"}, {"id": "q_1762323811001_4", "type": "multiple_choice", "options": ["9", "10", "11", "12"], "question": "What is 4 + 6?", "difficulty": "easy", "explanation": "4 and 6 make a friendly ten. Adding 4 to 6 reaches 10. The other options are either too small (9) or too large (11, 12).", "correctAnswer": "10"}]	none	2025-11-05 06:23:31.283792	\N
ee35162b-5f0f-47af-be3d-5abd20a313c9	8a5a53b7-a496-42ec-a023-6a3bde9e8207	Human Biology - Medium	Human Biology	medium	[{"id": "q_1762324892700_0", "type": "multiple_choice", "options": ["Rightward shift, promoting oxygen unloading to the tissues", "Leftward shift, promoting oxygen unloading to the tissues", "Rightward shift, reducing oxygen unloading to the tissues", "Leftward shift, increasing hemoglobin affinity and reducing tissue oxygen delivery"], "question": "A 22-year-old sprinter finishes a 400-meter race and is breathing heavily. In her exercising skeletal muscles, lactic acid accumulation has lowered the local pH. Which change in the hemoglobin–oxygen dissociation curve in those tissues is most likely, and what is the functional effect?", "difficulty": "medium", "explanation": "A decrease in pH (and increased CO2) shifts the hemoglobin–oxygen dissociation curve to the right (Bohr effect), decreasing hemoglobin’s affinity for oxygen so more O2 is released to metabolically active tissues. A left shift would increase affinity and hinder unloading.", "correctAnswer": "Rightward shift, promoting oxygen unloading to the tissues"}, {"id": "q_1762324892700_1", "type": "true_false", "question": "Loss of parathyroid hormone secretion (for example, after accidental removal of the parathyroid glands) would most likely increase neuromuscular excitability because of a drop in extracellular calcium levels.", "difficulty": "medium", "explanation": "Parathyroid hormone (PTH) increases blood calcium by stimulating bone resorption, renal calcium reabsorption, and activation of vitamin D to enhance intestinal absorption. Without PTH, hypocalcemia can develop, lowering the threshold for action potentials and causing tetany, muscle cramps, and paresthesias due to increased neuromuscular excitability.", "correctAnswer": "True"}, {"id": "q_1762324892700_2", "type": "fill_blank", "question": "The hormone that increases water reabsorption by inserting aquaporin-2 channels into the apical membrane of principal cells in the collecting ducts is ____.", "difficulty": "medium", "explanation": "ADH (vasopressin) binds V2 receptors on collecting duct principal cells, triggering cAMP-mediated insertion of aquaporin-2 water channels into the luminal membrane, thereby increasing water reabsorption and concentrating urine.", "correctAnswer": "antidiuretic hormone (ADH)"}, {"id": "q_1762324892700_3", "type": "short_answer", "question": "A patient with chronic iron-deficiency anemia has a hemoglobin concentration of 8 g/dL but normal pulmonary function. Explain why their resting heart rate and cardiac output are often elevated.", "difficulty": "medium", "explanation": "Oxygen delivery depends on both cardiac output and arterial oxygen content. In anemia, CaO2 falls due to reduced hemoglobin, so the compensatory response is to increase CO via sympathetic activation (tachycardia and increased contractility). Lower viscosity reduces systemic vascular resistance, further supporting an elevated CO at rest.", "correctAnswer": "Because anemia lowers arterial oxygen content (without lowering PaO2), tissues receive less oxygen per unit of blood. To maintain oxygen delivery (DO2 = CO × CaO2), the body compensates with increased sympathetic tone, raising heart rate and stroke volume; reduced blood viscosity in anemia also lowers afterload, facilitating a higher cardiac output."}, {"id": "q_1762324892700_4", "type": "multiple_choice", "options": ["Vitamin K", "Vitamin B12", "Vitamin C", "Folate"], "question": "A patient with obstructive jaundice from a gallstone has pale, greasy stools and easy bruising. Impaired micelle formation in the intestine will most directly reduce absorption of which vitamin, leading to the clotting problem?", "difficulty": "medium", "explanation": "Bile salts are required to form micelles for efficient absorption of dietary fats and fat-soluble vitamins (A, D, E, K). Obstruction of bile flow impairs absorption of these vitamins. Vitamin K deficiency leads to reduced gamma-carboxylation of clotting factors II, VII, IX, and X, causing easy bruising and bleeding.", "correctAnswer": "Vitamin K"}]	none	2025-11-05 06:41:32.972534	\N
07817c30-403a-4fb9-9e7d-99f094337ab5	1	Basic Math - Easy	Basic Math	easy	[{"id": "q_1773040971196_0", "type": "multiple_choice", "options": ["10", "11", "12", "13"], "question": "What is 7 + 5?", "difficulty": "easy", "explanation": "Adding 7 and 5 combines the two quantities: 7 + 5 = 12. You can think 7 + 3 = 10, then add the remaining 2 to get 12.", "correctAnswer": "12"}, {"id": "q_1773040971196_1", "type": "true_false", "question": "Zero is an even number.", "difficulty": "easy", "explanation": "An even number is any integer divisible by 2 with no remainder. 0 ÷ 2 = 0 with no remainder, so 0 is even.", "correctAnswer": "True"}, {"id": "q_1773040971196_2", "type": "fill_blank", "question": "15 − __ = 9", "difficulty": "easy", "explanation": "To find the missing number, think: 15 − ? = 9. Subtract 9 from 15 to get the difference: 15 − 9 = 6.", "correctAnswer": "6"}, {"id": "q_1773040971196_3", "type": "short_answer", "question": "In the number 3,482, what is the value of the digit 3?", "difficulty": "easy", "explanation": "The 3 is in the thousands place, so its value is 3 × 1,000 = 3,000.", "correctAnswer": "3,000"}, {"id": "q_1773040971196_4", "type": "multiple_choice", "options": ["Triangle", "Square", "Pentagon", "Circle"], "question": "Which shape has exactly 3 sides?", "difficulty": "easy", "explanation": "A triangle has 3 straight sides, a square has 4, a pentagon has 5, and a circle has no straight sides.", "correctAnswer": "Triangle"}]	\N	2026-03-09 07:22:51.217408	\N
dcfed873-12c7-4b6c-ba60-5a0d4638550e	1	World History - Medium	World History	medium	[{"id": "q_1773041028735_0", "type": "multiple_choice", "options": ["Roman Empire", "Mongol Empire", "Ottoman Empire", "Byzantine Empire"], "question": "Which of the following empires was known for its extensive road network that facilitated communication and trade?", "difficulty": "medium", "explanation": "The Roman Empire is renowned for its extensive and sophisticated road network, which spanned over 250,000 miles at its height. These roads were crucial for military logistics, trade, and the movement of information across the empire.", "correctAnswer": "Roman Empire"}, {"id": "q_1773041028735_1", "type": "true_false", "question": "The Treaty of Versailles ended World War I and imposed heavy reparations on Germany.", "difficulty": "medium", "explanation": "The Treaty of Versailles was signed in 1919 and formally ended World War I. It imposed significant reparations and territorial losses on Germany, contributing to economic hardship and political instability in the country during the interwar period.", "correctAnswer": "True"}, {"id": "q_1773041028735_2", "type": "fill_blank", "question": "The __________ was a cultural and intellectual movement during the Renaissance that emphasized the study of classical texts and humanism.", "difficulty": "medium", "explanation": "Renaissance humanism was a pivotal intellectual movement that emerged in the 14th century, focusing on the revival of classical learning from Ancient Greece and Rome. It emphasized human potential and achievements, influencing various fields such as art, literature, and philosophy.", "correctAnswer": "Renaissance humanism"}, {"id": "q_1773041028735_3", "type": "short_answer", "question": "Explain the significance of the Silk Road in the context of global trade during the ancient and medieval periods.", "difficulty": "medium", "explanation": "The Silk Road was not just a single road but a network of trade routes that allowed for the exchange of silk, spices, precious metals, and other goods. It also enabled the spread of technologies, philosophies, and religions, thus shaping the development of the regions it connected.", "correctAnswer": "The Silk Road was significant as it connected the East and West, facilitating trade of goods, culture, and ideas between civilizations like China, the Middle East, and Europe. It played a crucial role in economic and cultural exchanges, influencing societies along its routes."}, {"id": "q_1773041028735_4", "type": "multiple_choice", "options": ["The execution of Louis XVI", "The storming of the Bastille", "The signing of the Declaration of the Rights of Man", "The adoption of the Constitution of 1791"], "question": "Which event is often cited as the start of the French Revolution?", "difficulty": "medium", "explanation": "The storming of the Bastille on July 14, 1789, is widely regarded as the symbolic start of the French Revolution. It represented the uprising against the monarchy and the demand for political reform, leading to a series of events that ultimately transformed France.", "correctAnswer": "The storming of the Bastille"}]	\N	2026-03-09 07:23:48.758091	\N
5b6ea9d4-e797-49ea-b79a-4221d0afb8c7	1	Random Science Facts - Hard	Random Science Facts	hard	[{"id": "q_1773041046805_0", "type": "multiple_choice", "options": ["Chlorophyll concentration", "Water availability", "Soil nutrients", "Air pollution"], "question": "What is the primary reason for the difference in color between the two sides of a leaf?", "difficulty": "hard", "explanation": "Leaves are typically green due to the presence of chlorophyll, which is crucial for photosynthesis. The color difference can be attributed to varying concentrations of chlorophyll and other pigments, especially on the sunlit side versus the shaded side.", "correctAnswer": "Chlorophyll concentration"}, {"id": "q_1773041046805_1", "type": "true_false", "question": "True or False: The speed of light is constant regardless of the medium through which it travels.", "difficulty": "hard", "explanation": "The speed of light is constant in a vacuum, but it changes when passing through different media, such as water or glass, due to refraction.", "correctAnswer": "False"}, {"id": "q_1773041046805_2", "type": "fill_blank", "question": "The process of converting light energy into chemical energy in plants is known as __________.", "difficulty": "hard", "explanation": "Photosynthesis is the biochemical process in which plants use sunlight to convert carbon dioxide and water into glucose and oxygen, essential for their growth and energy.", "correctAnswer": "photosynthesis"}, {"id": "q_1773041046805_3", "type": "short_answer", "question": "Explain the significance of the Haber process in modern agriculture.", "difficulty": "hard", "explanation": "The Haber process allows for the large-scale production of ammonia, which is vital for creating synthetic fertilizers. This has revolutionized agriculture, enabling increased food production to meet the demands of a growing population.", "correctAnswer": "The Haber process is significant because it synthesizes ammonia from nitrogen and hydrogen, providing a crucial source of nitrogen for fertilizers that support global crop production."}, {"id": "q_1773041046805_4", "type": "multiple_choice", "options": ["Oxygen", "Silicon", "Aluminium", "Iron"], "question": "Which of the following elements is most abundant in the Earth's crust?", "difficulty": "hard", "explanation": "Oxygen is the most abundant element in the Earth's crust, making up about 46% of its composition, primarily found in silicate minerals.", "correctAnswer": "Oxygen"}, {"id": "q_1773041046805_5", "type": "true_false", "question": "True or False: All isotopes of an element have the same number of neutrons.", "difficulty": "hard", "explanation": "Isotopes of an element have the same number of protons but different numbers of neutrons, leading to variations in their mass.", "correctAnswer": "False"}, {"id": "q_1773041046805_6", "type": "fill_blank", "question": "The phenomenon where a liquid turns into vapor at temperatures below its boiling point is known as __________.", "difficulty": "hard", "explanation": "Evaporation is a process that occurs at any temperature, where molecules at the surface of a liquid gain enough energy to transition into the gas phase.", "correctAnswer": "evaporation"}, {"id": "q_1773041046805_7", "type": "short_answer", "question": "Describe how the theory of plate tectonics explains the occurrence of earthquakes.", "difficulty": "hard", "explanation": "The movement of tectonic plates can lead to the accumulation of strain in Earth's crust, and when this strain exceeds the strength of rocks along faults, it releases energy in the form of earthquakes.", "correctAnswer": "The theory of plate tectonics explains that earthquakes occur due to the movement of tectonic plates, which can cause stress to build up along faults and eventually release as seismic waves."}, {"id": "q_1773041046805_8", "type": "multiple_choice", "options": ["Energy conservation", "Disorder in a system", "Heat transfer", "Chemical equilibrium"], "question": "Which of the following best describes the concept of entropy in thermodynamics?", "difficulty": "hard", "explanation": "Entropy is a measure of the disorder or randomness in a system, and according to the second law of thermodynamics, the total entropy of an isolated system can never decrease over time.", "correctAnswer": "Disorder in a system"}, {"id": "q_1773041046805_9", "type": "true_false", "question": "True or False: Mitochondria are known as the powerhouse of the cell because they produce glucose.", "difficulty": "hard", "explanation": "Mitochondria are known as the powerhouse of the cell because they produce adenosine triphosphate (ATP) through cellular respiration, not glucose.", "correctAnswer": "False"}]	\N	2026-03-09 07:24:06.819753	\N
9db3c800-b2dc-4d8d-b801-b1d5e8512df2	79991994-983b-4ae3-a9b2-4d165805e751	Solar System - Medium	Solar System	medium	[{"id": "q_1773041158348_0", "type": "multiple_choice", "options": ["Jupiter", "Mars", "Saturn", "Neptune"], "question": "Which planet is known for its prominent ring system?", "difficulty": "medium", "explanation": "Saturn is well-known for its stunning and extensive ring system, which is made up of ice and rock particles. While other gas giants like Jupiter, Uranus, and Neptune have rings, Saturn's are the most visible and elaborate.", "correctAnswer": "Saturn"}, {"id": "q_1773041158348_1", "type": "true_false", "question": "Venus is the hottest planet in the Solar System.", "difficulty": "medium", "explanation": "Despite being second from the Sun, Venus has a thick atmosphere composed mainly of carbon dioxide, creating a strong greenhouse effect that raises surface temperatures higher than those of Mercury, the closest planet to the Sun.", "correctAnswer": "True"}, {"id": "q_1773041158348_2", "type": "fill_blank", "question": "The largest moon of Saturn is called __________.", "difficulty": "medium", "explanation": "Titan is Saturn's largest moon and is notable for its thick atmosphere and surface lakes of liquid methane and ethane, making it a subject of interest for studies about extraterrestrial life.", "correctAnswer": "Titan"}, {"id": "q_1773041158348_3", "type": "short_answer", "question": "What is the main component of the Sun's composition?", "difficulty": "medium", "explanation": "The Sun is primarily composed of hydrogen, making up about 74% of its mass, followed by helium at around 24%. This composition plays a crucial role in the nuclear fusion processes that power the Sun.", "correctAnswer": "Hydrogen"}, {"id": "q_1773041158348_4", "type": "multiple_choice", "options": ["Mars", "Jupiter", "Venus", "Earth"], "question": "Which planet has the longest day relative to its year?", "difficulty": "medium", "explanation": "Venus has a very slow rotation on its axis, taking about 243 Earth days to complete one rotation, while its orbit around the Sun takes about 225 Earth days. This means a day on Venus is longer than a year.", "correctAnswer": "Venus"}]	none	2026-03-09 07:25:58.368386	\N
4d33813c-f5de-4122-a924-624eaed67b35	79991994-983b-4ae3-a9b2-4d165805e751	ICT - Medium	ICT	medium	[{"id": "q_1773041626236_0", "type": "multiple_choice", "options": ["FTP", "HTTP", "SMTP", "IMAP"], "question": "Which of the following protocols is primarily used for sending emails?", "difficulty": "medium", "explanation": "SMTP, or Simple Mail Transfer Protocol, is the standard protocol used for sending emails across the Internet. FTP is used for file transfer, HTTP for web traffic, and IMAP is for retrieving emails.", "correctAnswer": "SMTP"}, {"id": "q_1773041626236_1", "type": "true_false", "question": "Cloud computing is primarily about storing data on local servers.", "difficulty": "medium", "explanation": "Cloud computing refers to storing and accessing data and programs over the Internet instead of on local servers or personal computers. It allows for scalable resources and services on demand.", "correctAnswer": "False"}, {"id": "q_1773041626236_2", "type": "fill_blank", "question": "In a network, a ________ acts as a gatekeeper that controls the incoming and outgoing traffic based on predetermined security rules.", "difficulty": "medium", "explanation": "A firewall is a network security device that monitors and controls incoming and outgoing network traffic based on security rules. It serves as a barrier between a trusted internal network and untrusted external networks.", "correctAnswer": "firewall"}, {"id": "q_1773041626236_3", "type": "short_answer", "question": "What is the primary purpose of an operating system in a computer?", "difficulty": "medium", "explanation": "The operating system (OS) is crucial as it manages the computer's hardware and software resources, allowing users to interact with the computer and run applications effectively.", "correctAnswer": "To manage hardware and software resources and provide a user interface."}, {"id": "q_1773041626236_4", "type": "multiple_choice", "options": ["Operating System", "Database", "Network", "Web Browser"], "question": "Which of the following is NOT a type of software?", "difficulty": "medium", "explanation": "While Operating Systems, Databases, and Web Browsers are types of software, 'Network' refers to a system of interconnected computers and devices rather than a software application.", "correctAnswer": "Network"}]	none	2026-03-09 07:33:46.250392	\N
\.


--
-- Data for Name: study_groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.study_groups (id, name, description, subject, creator_id, member_ids, created_at, code) FROM stdin;
8f7c7a5f-9123-4f4f-9d88-974889f0e788	Chem	Lets do it	Chems	8a5a53b7-a496-42ec-a023-6a3bde9e8207	{8a5a53b7-a496-42ec-a023-6a3bde9e8207}	2025-11-04 19:40:55.918166	7F8BCA
b7746926-568f-4858-813e-b7f0446b9d27	Study Group	Math study	Math	79991994-983b-4ae3-a9b2-4d165805e751	{79991994-983b-4ae3-a9b2-4d165805e751}	2026-02-05 16:32:56.08025	IQKE9T
c40fc848-916c-4e90-b224-fbea5b0bf093	Test Study Group Zrb0XM	A test group for studying math	Mathematics	79991994-983b-4ae3-a9b2-4d165805e751	{79991994-983b-4ae3-a9b2-4d165805e751}	2026-02-05 16:43:24.345422	YO6CER
\.


--
-- Data for Name: study_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.study_sessions (id, user_id, subject, duration, type, completed_at) FROM stdin;
\.


--
-- Data for Name: support_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.support_messages (id, user_id, sender_id, sender_role, message, read, created_at) FROM stdin;
9889cb34-005d-41f4-9421-87587291b6ee	f4a3bc53-45f9-406c-b0a4-c27e3bf10c61	f4a3bc53-45f9-406c-b0a4-c27e3bf10c61	student	Hello admin, I need help with my account	t	2026-03-11 08:02:10.845748
8780c712-b309-4cc7-977a-afc1918e261b	f4a3bc53-45f9-406c-b0a4-c27e3bf10c61	1c2c9228-bcf5-46e9-9076-9dd12720e236	admin	Hi there! How can I help you?	f	2026-03-11 08:03:01.858696
06a9d834-b5a9-4433-b20c-28a5befab89d	79991994-983b-4ae3-a9b2-4d165805e751	79991994-983b-4ae3-a9b2-4d165805e751	student	Hello	t	2026-03-11 08:13:43.59537
6fc5815d-b528-4e26-bf40-32375c5fe54e	d215c89c-04e5-4133-ba1b-7b4e5357c3f9	d215c89c-04e5-4133-ba1b-7b4e5357c3f9	teacher	Hello	f	2026-03-11 08:14:39.415571
3c0a4d52-de56-4481-90b5-beee8e227833	79991994-983b-4ae3-a9b2-4d165805e751	1c2c9228-bcf5-46e9-9076-9dd12720e236	admin	Hello Demo student. how can i help you	t	2026-03-11 08:14:17.736853
\.


--
-- Data for Name: teacher_quiz_attempts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.teacher_quiz_attempts (id, quiz_id, student_id, answers, auto_score, manual_score, total_score, status, time_spent, graded_by, graded_at, submitted_at) FROM stdin;
5108b80d-cb1b-46bc-a50e-ab9080ce3b7e	82d074c6-b428-4e6f-b4e4-5a962d560c63	c7129cee-987a-4c13-8372-0df9817e06fc	[{"isCorrect": true, "questionId": "42075d3b-d919-454b-92d2-0dd6be5a133f", "questionType": "mcq", "pointsAwarded": 1, "selectedAnswer": 1}]	1	\N	\N	submitted	13	\N	\N	2025-12-06 15:16:25.245764
\.


--
-- Data for Name: teacher_quizzes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.teacher_quizzes (id, class_id, teacher_id, title, description, questions, time_limit, passing_score, total_points, is_published, due_date, created_at, updated_at) FROM stdin;
e79d0a93-c2ee-4373-b51b-2806668a29ac	8b4eee4a-d29a-46dc-a9a8-26fac574768b	b7121fb1-0d33-4c5c-a69b-2278c4f622d6	Science Quiz	\N	[{"id": "e98e8eec-0d65-4a7d-b492-efa2ca00b162", "type": "mcq", "points": 1, "options": ["Carbon Dioxide", "Water", "Oxygen", "Nitrogen"], "question": "What is H2O?", "correctAnswer": 1}]	\N	\N	1	f	\N	2025-12-06 15:09:53.343681	2025-12-06 15:09:53.343681
82d074c6-b428-4e6f-b4e4-5a962d560c63	f3b179d9-f68c-4e67-88a8-b12b49dd8a5c	9976e7d1-3246-46ec-bd4d-b31ec7a7ed03	Student Quiz ThC3J2	\N	[{"id": "42075d3b-d919-454b-92d2-0dd6be5a133f", "type": "mcq", "points": 1, "options": ["3", "4", "5", "6"], "question": "What is 2+2?", "correctAnswer": 1}]	\N	\N	1	t	\N	2025-12-06 15:13:12.049875	2025-12-06 15:13:20.643
8fdb8479-47d2-4eb6-bda8-f64ce5e814c1	b0661262-f2fb-4163-8db2-e48c1f0fc31b	d215c89c-04e5-4133-ba1b-7b4e5357c3f9	ICT Quiz	Introction to ICT	[{"id": "059581d9-a68e-46b5-ac4f-a49a87292c9b", "type": "mcq", "points": 10, "options": ["cant measure", "10m", "100m", "1000m"], "question": "How high is the sky", "correctAnswer": 0}]	120	100	10	f	\N	2025-12-08 06:46:26.648418	2025-12-08 06:46:26.648418
fde66af0-e075-4532-bb70-aaefe6ffdcff	b0661262-f2fb-4163-8db2-e48c1f0fc31b	d215c89c-04e5-4133-ba1b-7b4e5357c3f9	ICT Quiz	Introction to ICT	[{"id": "059581d9-a68e-46b5-ac4f-a49a87292c9b", "type": "mcq", "points": 10, "options": ["cant measure", "10m", "100m", "1000m"], "question": "How high is the sky", "correctAnswer": 0}]	120	100	10	t	\N	2025-12-08 06:46:27.451498	2025-12-08 06:46:39.977
\.


--
-- Data for Name: todos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.todos (id, class_id, title, description, due_date, resource_link, created_by, created_at) FROM stdin;
5abc9aea-b116-464f-a817-cc528efd9ee8	04403f75-34bc-46b3-aa6b-318c7b55aeab	Read Chapter 5	Complete reading and take notes	\N	\N	aa5f49fa-4c32-4097-86ad-4780aaf2937d	2025-11-30 18:10:18.908496
d1d4363f-9b12-4c6b-a4ee-ce2d1592b034	56735025-afaf-417d-88b0-cefca0c40b7f	Read Chapter 5		\N	\N	2444116a-be14-4701-a8bd-aaccd99744c3	2025-11-30 18:24:10.982204
\.


--
-- Data for Name: training_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.training_items (id, topic_id, type, title, description, content, attachment_url, attachment_name, status, created_by, created_at, updated_at, video_url, attachment_path, questions) FROM stdin;
17a6646f-6a0a-46c4-822b-6f43ee669cf8	961b632c-fc98-41ca-a9d3-50bb5f7e1a57	module	Introduction to Testing v2	Learn the basics of software testing	Detailed content about testing basics.	\N	\N	posted	e8b79414-8713-4f70-8aec-e9cbdf7d4ec0	2026-03-09 08:03:53.721465	2026-03-09 08:04:15.451	\N	\N	\N
d622ec5c-2b37-465f-a570-89d4e0718282	961b632c-fc98-41ca-a9d3-50bb5f7e1a57	module	Video Lecture: Intro to ML	Watch this introductory machine learning video	\N	\N	\N	posted	1c2c9228-bcf5-46e9-9076-9dd12720e236	2026-03-09 08:35:28.758534	2026-03-09 08:35:28.758534	https://www.youtube.com/watch?v=dQw4w9WgXcQ	\N	\N
3456dd29-105c-4d59-be6b-6f4c225a82c7	\N	assignment	Week 1 Homework	Complete the reading assignment	\N	\N	\N	posted	1c2c9228-bcf5-46e9-9076-9dd12720e236	2026-03-09 09:44:06.978861	2026-03-09 09:44:06.978861	\N	\N	\N
2fc5bf04-7d96-4721-9cff-cd3864223452	\N	module	Scroll Test Module	\N	\N	\N	\N	draft	1c2c9228-bcf5-46e9-9076-9dd12720e236	2026-03-09 10:37:06.009001	2026-03-09 10:37:06.009001	\N	\N	\N
021e104b-4899-4a4f-85e3-c16efa1dd9f8	\N	quiz	Test Quiz ABC123	A test quiz with questions	\N	\N	\N	posted	1c2c9228-bcf5-46e9-9076-9dd12720e236	2026-03-10 06:29:15.03393	2026-03-10 06:29:15.03393	\N	\N	[{"id": "tq_1773124137117_akj1", "options": ["3", "4", "5", "6"], "question": "What is 2 + 2?", "explanation": "2 + 2 = 4", "correctAnswer": 1}, {"id": "tq_1773124149066_bk85", "options": ["Red", "Blue", "Green", "Yellow"], "question": "What color is the sky?", "correctAnswer": 1}]
e1ed4d61-4601-4a60-9a11-82f9bb7456b3	\N	quiz	Empty Quiz XYZ789	A quiz without questions	\N	\N	\N	posted	1c2c9228-bcf5-46e9-9076-9dd12720e236	2026-03-10 06:48:17.188169	2026-03-10 06:48:17.188169	\N	\N	\N
\.


--
-- Data for Name: training_progress; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.training_progress (id, user_id, item_id, completed, completed_at) FROM stdin;
d775d56f-37b7-4066-a1d7-608b0cd345df	d215c89c-04e5-4133-ba1b-7b4e5357c3f9	d622ec5c-2b37-465f-a570-89d4e0718282	t	2026-03-09 11:23:32.971
\.


--
-- Data for Name: training_quiz_attempts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.training_quiz_attempts (id, user_id, item_id, answers, score, total_questions, completed_at) FROM stdin;
\.


--
-- Data for Name: training_topics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.training_topics (id, title, "position", created_by, created_at) FROM stdin;
961b632c-fc98-41ca-a9d3-50bb5f7e1a57	Week 1 Materials	0	e8b79414-8713-4f70-8aec-e9cbdf7d4ec0	2026-03-09 08:03:11.840654
\.


--
-- Data for Name: tutor_conversations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tutor_conversations (id, user_id, messages, subject, created_at, updated_at) FROM stdin;
8e4b5692-1fca-4ddd-b626-bef2c5f13253	8a5a53b7-a496-42ec-a023-6a3bde9e8207	[]	\N	2025-11-04 18:43:45.739048	2025-11-04 18:43:45.739048
a1a4cf7b-d968-4dac-b208-04621284d876	8a5a53b7-a496-42ec-a023-6a3bde9e8207	[]	\N	2025-11-04 18:43:45.996678	2025-11-04 18:43:45.996678
a0ac84bb-c6d4-4f15-99b0-2ab60bc33bb8	8a5a53b7-a496-42ec-a023-6a3bde9e8207	[]	\N	2025-11-04 18:43:52.468422	2025-11-04 18:43:52.468422
de8dbea5-ee92-46d8-aa5e-30dc6cfaecc3	8a5a53b7-a496-42ec-a023-6a3bde9e8207	[]	\N	2025-11-04 18:46:32.605345	2025-11-04 18:46:32.605345
b5cad1e8-9ab3-4370-ae9e-4e8c7cec5437	8a5a53b7-a496-42ec-a023-6a3bde9e8207	[]	\N	2025-11-04 18:46:32.920261	2025-11-04 18:46:32.920261
23372203-0009-4ecd-9d88-db76e64c9001	8a5a53b7-a496-42ec-a023-6a3bde9e8207	[]	\N	2025-11-04 18:54:52.100363	2025-11-04 18:54:52.100363
7df20091-ac27-40df-93c7-5a69234ab03f	8a5a53b7-a496-42ec-a023-6a3bde9e8207	[]	\N	2025-11-04 18:54:52.117219	2025-11-04 18:54:52.117219
b48897c6-a531-4f31-a1df-d9ce778f8ee1	8a5a53b7-a496-42ec-a023-6a3bde9e8207	[]	\N	2025-11-04 19:24:44.260189	2025-11-04 19:24:44.260189
8a41f139-4352-415e-879b-eb06ff589e50	8a5a53b7-a496-42ec-a023-6a3bde9e8207	[]	\N	2025-11-04 19:24:44.490227	2025-11-04 19:24:44.490227
b0611d6c-7197-4edb-86e0-cb68a6c2efed	8a5a53b7-a496-42ec-a023-6a3bde9e8207	[]	\N	2025-11-04 19:29:02.523367	2025-11-04 19:29:02.523367
37ef27a4-7671-4d1c-9b28-7bccb055691d	8a5a53b7-a496-42ec-a023-6a3bde9e8207	[]	\N	2025-11-04 19:29:02.756747	2025-11-04 19:29:02.756747
8b4592ba-9863-4989-94e1-9f7ae0f6053c	8a5a53b7-a496-42ec-a023-6a3bde9e8207	[]	\N	2025-11-04 19:35:34.026866	2025-11-04 19:35:34.026866
b0f10459-2fae-4642-9d3b-41cbd9916ba9	8a5a53b7-a496-42ec-a023-6a3bde9e8207	[]	\N	2025-11-04 19:35:36.022794	2025-11-04 19:35:36.022794
c10d0ae9-9140-41fe-b288-d41c028f791b	8a5a53b7-a496-42ec-a023-6a3bde9e8207	[]	\N	2025-11-04 19:40:12.359525	2025-11-04 19:40:12.359525
0464041d-18ef-414f-8e1b-98f6e3b9a6a8	8a5a53b7-a496-42ec-a023-6a3bde9e8207	[]	\N	2025-11-04 19:40:12.598301	2025-11-04 19:40:12.598301
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, password, name, role, grade, points, streak, level, xp, last_login_date, created_at) FROM stdin;
e248a5bd-4299-407c-a02e-981315d9ebcf	teacher_ll4lNy	$2b$10$uKjlAQLiHEfsEPfwMSYiA.25gWE6.mKW9UAs5RbAGK3NniqyfwPXa	Test Teacher mPDsmL	teacher	\N	0	0	1	0	\N	2025-11-30 18:00:12.160406
c526f479-9c86-4c3c-a813-8c05b11da8d8	test_Z1X9vX	$2b$10$Ed99hPFRUDyAX5vmckpd8OrdfwiEutxosFb4kn9kQXUPiEbSjPJcW	Test Student test_Z1X9vX	student	Grade 11	0	1	1	0	2025-11-04 17:35:17.537	2025-11-04 17:31:36.159769
eacfbc92-4089-4c34-9e12-63fa5be07036	test_k_vYi_TO	$2b$10$dt..b2xXZNPXw2rcqMD5AeysF7lPEVmV5R5QvTYE19a2jgxAABZs2	Test Student test_k_vYi_TO	student	Grade 11	0	0	1	0	\N	2025-11-04 17:40:44.318997
4b615de3-007a-4c89-a437-f1a23b4fb70a	quiztestk_zik1	$2b$10$vjW065e537AjPoBjAS28bONYdXBBW1muLJN9Yyo7Dr8kSngYLNydq	Quiz Test User	student	10	0	0	1	0	\N	2025-11-04 20:05:30.486314
9503da73-a397-4550-9eff-bdc8a83c8828	finalquizwmeeh7	$2b$10$Y/0rx8b1HXGVcY7lcz8Dc.5hhgfyyxFd2mO7peRfDzGQ/tsIrMnrG	Final Quiz Tester	student	12A	0	0	1	0	\N	2025-11-04 20:08:50.274062
782db9e0-0a4b-430e-81d8-f2f5f80d6475	fulltestX_NtpH	$2b$10$/WuvMWeFnFMA5QHG9jmIGetzS0ZLPf6KFwVK6Ty.CX0J6WpQNbOom	Full Test User	student	10A	0	0	1	0	\N	2025-11-04 20:12:56.485815
b877ed07-995e-482c-9824-5aa75890864b	success4iyYZA	$2b$10$.Azx9kC3J31toML911dyo.I9exu3.eS2t6wqzVRR7jtwPJgsRc0/6	Success User	student	10	0	0	1	0	\N	2025-11-04 20:17:01.608246
855409dc-5242-4690-b218-9eb714270eb9	teacher_TRVWka	$2b$10$n9NW9/aM18.ZkgoK/ZdRz.efGv1EVrg1LjgBTc9IMI98ImbsC8thq	Test Teacher SXbw7-	teacher	\N	0	0	1	0	\N	2025-11-30 18:04:31.883864
320d5dae-e0b3-4850-a634-21e626a86eca	chatbot-test-fMKc_U	$2b$10$wA1A3dFdTeasifRy4XNjBOQm3SLXivPqFtqfPyYdBnF4RaUgDvu12	Chatbot Tester	student	10	0	0	1	0	\N	2025-11-04 18:08:00.1752
aa5f49fa-4c32-4097-86ad-4780aaf2937d	teacher_tRfKW_	$2b$10$EsDNv6uA8GsLcO2F0GYev.Z0Ebel20RGy4nyox/8r3NR2USUC2bQG	Test Teacher PvZ2QK	teacher	\N	0	0	1	0	\N	2025-11-30 18:08:32.965147
2444116a-be14-4701-a8bd-aaccd99744c3	teachvSi9	$2b$10$uQYubCEdvI.z/tVGIuVl9.UwNtHMVMDq4jxDOclYLawpXM0PtFV.q	TestTeacher6C0s	teacher	\N	0	0	1	0	\N	2025-11-30 18:22:30.444953
4a152f5d-c3da-48ac-8465-162e9be13e0d	studsqcB	$2b$10$BWquBWn9lyfn.zH8qhMfbe3TCCKNpEdwy2xj4Zgo9OLwxa4IuPnr2	Student7nEb	student	\N	0	0	1	0	\N	2025-11-30 18:28:08.854478
9bc1962f-1f12-4b88-b13d-09d27c3c70c8	test-student-Lk2Zpa	$2b$10$0T5CRLCStqdW9vBjzNzJv./phCl3VvjSl9P6yklm6e7sk5.0HdZsi	Test Student	student	10	0	0	1	0	\N	2025-11-04 18:40:12.400643
8a5a53b7-a496-42ec-a023-6a3bde9e8207	Sethunya	$2b$10$qTMIsNwRGlU0MSquQ17SBuIq1tcBi3GSzK0Gn2rgr3IutSOu1RHZ6	Sethunya Dema	student	Grade 10	0	1	1	0	2025-11-05 06:48:14.51	2025-11-04 17:50:12.022643
9c0cb334-28f6-443c-bd2a-b98a96c51038	fastbot-test-CqrgdA	$2b$10$ZQ0CajbyGN25/tCWHVUK1edWx58SGcMNWoDJUhFnGqGk91uRac28W	FastBot Tester	student	10	0	0	1	0	\N	2025-11-04 18:50:25.277853
741590b2-7cc4-434e-b087-ff5fa4891606	teacher@test.com	$2b$10$x20ruHXe41mViZxczf0AHe9KczM3j1mNczkugXqgjM6utlU1DQW4C	Teacher Test	teacher	\N	0	1	1	0	2025-11-30 19:59:48.296	2025-11-30 19:53:50.187096
eea623d5-4569-4c22-96c2-bdfe66d0dc37	bottest--ICFYJ	$2b$10$ygsgWNCd5qLkV3056CO/AOnfjBeE/xC16247cEYCjkHBsUNLYoaaK	Bot Tester	student	10	0	0	1	0	\N	2025-11-04 18:57:14.68705
b7121fb1-0d33-4c5c-a69b-2278c4f622d6	teacher_-bXmh2	$2b$10$QIw4bJTXk2UB0WW3knMBBeI2SdpbRvEDmuRhh6FilnwfZTk9QmxHi	Test Teacher -bXmh2	teacher	\N	0	0	1	0	\N	2025-12-06 15:07:20.193222
42770508-1793-48e0-baf6-75c6ef64d653	iframe2mmd8e	$2b$10$D9/Ad0KQQkUwIt1R6Cg7tOpnKswLVQZvA3NE8HcGi.8lW/yVagQdC	Test User	student	10	0	0	1	0	\N	2025-11-04 19:32:43.565229
9976e7d1-3246-46ec-bd4d-b31ec7a7ed03	quizteacher_5qZ2NN	$2b$10$Mlzv5zgOqF9iNmF.RTKPE.IGChOZxyqLDcuyc.RkrBnG4nVrO7LxO	Quiz Teacher pQkmen	teacher	\N	0	0	1	0	\N	2025-12-06 15:11:09.544059
496aad69-496d-4af6-8211-6bc0b4f96454	controls8xuhlG	$2b$10$RxB.MlbewkIgkz/4M4jLU.RwzHyg7I1MfP85b1gU6DBewMSIEwqwm	Control Tester	student	10A	0	0	1	0	\N	2025-11-04 19:38:03.322928
c7129cee-987a-4c13-8372-0df9817e06fc	teststudent_bCJOEB	$2b$10$BjgpvoHfm2i5saie.wiVD.tEwDje/W2amZZQi4exVIfQU0KPCiOXS	Test Student eACir_	student	\N	0	0	1	0	\N	2025-12-06 15:14:24.151963
ceed69be-f30f-4dbf-aa37-040e233029f1	tutordq9CMx	$2b$10$2drFmHiJfvwsEFho50KnIepJx3/CTFRYDL.ALoRA2ZdwMSv7tIZne	Tutor Tester	student	10	0	0	1	0	\N	2025-11-04 19:44:14.984898
ae790e99-50c9-4cb0-8c98-efd32525610e	quizJoFzfh	$2b$10$seoZNqfEHEseXtOsqi/qZ.XLogVKVgO0cqK0xTs3J/VcID8WGwX86	Quiz Tester	student	Grade 10	0	0	1	0	\N	2025-11-04 19:52:36.73691
58b42472-7219-4c1e-a645-815a924ba777	Sethunyaj	$2b$10$ZGfi8bQiCqlr4A2cZMzAE.vS/AfhJHSJS8PUgLwUY0waSeqOmDo1m	Sethunya Dema	student	Grade 10	0	1	1	0	2025-11-07 05:32:34.775	2025-11-07 05:32:07.531562
f4a3bc53-45f9-406c-b0a4-c27e3bf10c61	support_test_student_01	$2b$10$miZjDoph.Kimlk0xeEjuMOH/mkKMXL7q6Wz1WgFCSF/ySUMnoz3pO	Support Tester	student	\N	0	1	1	0	2026-03-11 08:01:55.999	2026-03-11 08:01:44.045246
1c2c9228-bcf5-46e9-9076-9dd12720e236	admin	$2b$10$7SWuU27TRZurYqt6.7ZzXewfbSF1FecGDqwIzRJA4nXKW.JOLLih.	Administrator	admin	\N	0	2	1	0	2026-03-11 08:16:05.982	2025-11-04 17:27:27.533884
79991994-983b-4ae3-a9b2-4d165805e751	demo	$2b$10$OQC2lKPkHR5xWQ0OfOJAQu9Jd4C.pnlDID8lRayFZXGrDubTXe.Pm	Demo Student	student	Grade 10	0	1	1	0	2026-03-17 07:33:22.484	2025-11-04 20:22:24.070705
e8b79414-8713-4f70-8aec-e9cbdf7d4ec0	teacher_1773043331785@test.com	$2b$10$zuF7bDP4Wc6/9y8sHruLaeJhr1E1apwC9dt3UPfZScXHKSquEaNpq	TestTeacher_1773043331785	teacher	\N	0	0	1	0	\N	2026-03-09 08:02:50.239315
d215c89c-04e5-4133-ba1b-7b4e5357c3f9	teacher	$2b$10$u9lYbye8YkOW1gxKi6nm7ObT17PkH0FgoGyBU.IHsSj2XJnZTmule	Demo Teacher	teacher	\N	0	1	1	0	2026-03-17 07:39:26.804	2025-11-30 18:35:58.776434
\.


--
-- Name: achievements achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.achievements
    ADD CONSTRAINT achievements_pkey PRIMARY KEY (id);


--
-- Name: class_enrollments class_enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.class_enrollments
    ADD CONSTRAINT class_enrollments_pkey PRIMARY KEY (id);


--
-- Name: class_resources class_resources_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.class_resources
    ADD CONSTRAINT class_resources_pkey PRIMARY KEY (id);


--
-- Name: classes classes_code_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_code_unique UNIQUE (code);


--
-- Name: classes classes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_pkey PRIMARY KEY (id);


--
-- Name: exams exams_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exams
    ADD CONSTRAINT exams_pkey PRIMARY KEY (id);


--
-- Name: flashcards flashcards_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flashcards
    ADD CONSTRAINT flashcards_pkey PRIMARY KEY (id);


--
-- Name: group_announcements group_announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_announcements
    ADD CONSTRAINT group_announcements_pkey PRIMARY KEY (id);


--
-- Name: group_messages group_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_messages
    ADD CONSTRAINT group_messages_pkey PRIMARY KEY (id);


--
-- Name: group_notes group_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_notes
    ADD CONSTRAINT group_notes_pkey PRIMARY KEY (id);


--
-- Name: mind_maps mind_maps_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mind_maps
    ADD CONSTRAINT mind_maps_pkey PRIMARY KEY (id);


--
-- Name: news_comments news_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.news_comments
    ADD CONSTRAINT news_comments_pkey PRIMARY KEY (id);


--
-- Name: news_likes news_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.news_likes
    ADD CONSTRAINT news_likes_pkey PRIMARY KEY (id);


--
-- Name: news_posts news_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.news_posts
    ADD CONSTRAINT news_posts_pkey PRIMARY KEY (id);


--
-- Name: notes notes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_pkey PRIMARY KEY (id);


--
-- Name: platform_settings platform_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platform_settings
    ADD CONSTRAINT platform_settings_pkey PRIMARY KEY (id);


--
-- Name: quiz_attempts quiz_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_attempts
    ADD CONSTRAINT quiz_attempts_pkey PRIMARY KEY (id);


--
-- Name: quizzes quizzes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT quizzes_pkey PRIMARY KEY (id);


--
-- Name: study_groups study_groups_code_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.study_groups
    ADD CONSTRAINT study_groups_code_unique UNIQUE (code);


--
-- Name: study_groups study_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.study_groups
    ADD CONSTRAINT study_groups_pkey PRIMARY KEY (id);


--
-- Name: study_sessions study_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.study_sessions
    ADD CONSTRAINT study_sessions_pkey PRIMARY KEY (id);


--
-- Name: support_messages support_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_messages
    ADD CONSTRAINT support_messages_pkey PRIMARY KEY (id);


--
-- Name: teacher_quiz_attempts teacher_quiz_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_quiz_attempts
    ADD CONSTRAINT teacher_quiz_attempts_pkey PRIMARY KEY (id);


--
-- Name: teacher_quizzes teacher_quizzes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_quizzes
    ADD CONSTRAINT teacher_quizzes_pkey PRIMARY KEY (id);


--
-- Name: todos todos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.todos
    ADD CONSTRAINT todos_pkey PRIMARY KEY (id);


--
-- Name: training_items training_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_items
    ADD CONSTRAINT training_items_pkey PRIMARY KEY (id);


--
-- Name: training_progress training_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_progress
    ADD CONSTRAINT training_progress_pkey PRIMARY KEY (id);


--
-- Name: training_quiz_attempts training_quiz_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_quiz_attempts
    ADD CONSTRAINT training_quiz_attempts_pkey PRIMARY KEY (id);


--
-- Name: training_topics training_topics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_topics
    ADD CONSTRAINT training_topics_pkey PRIMARY KEY (id);


--
-- Name: tutor_conversations tutor_conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tutor_conversations
    ADD CONSTRAINT tutor_conversations_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- PostgreSQL database dump complete
--

\unrestrict hKqcsDRGKKzJg0SqBTBOKBJXUhtWAJU8ZVVqaKilnhsKrtpxDKWMqCEUD4Eq1U4

