--
-- PostgreSQL database dump
--

\restrict YFvIHVFwxrk0jWxDRe5N1mph8vJG9z9kE8NVfVgvQKjFsffFcwyzyf8V5D8DTw2

-- Dumped from database version 15.19
-- Dumped by pg_dump version 15.19

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

--
-- Name: estado_cita; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.estado_cita AS ENUM (
    'PROGRAMADA',
    'ATENDIDA',
    'CANCELADA'
);


--
-- Name: tipo_diabetes; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_diabetes AS ENUM (
    'TIPO_1',
    'TIPO_2',
    'GESTACIONAL',
    'OTRO'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: antecedentes_medicos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.antecedentes_medicos (
    id text NOT NULL,
    patient_id text NOT NULL,
    tiene_diabetes boolean DEFAULT false NOT NULL,
    tipo_diabetes public.tipo_diabetes,
    tiene_hipertension boolean DEFAULT false NOT NULL,
    tiene_cardiopatia boolean DEFAULT false NOT NULL,
    toma_anticoagulantes boolean DEFAULT false NOT NULL,
    esta_embarazada boolean DEFAULT false NOT NULL,
    alergias text[] DEFAULT ARRAY[]::text[],
    medicacion_actual text,
    otras_condiciones text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: appointments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appointments (
    id text NOT NULL,
    patient_id text NOT NULL,
    motivo character varying(200) NOT NULL,
    fecha_inicio timestamp(3) without time zone NOT NULL,
    fecha_fin timestamp(3) without time zone NOT NULL,
    estado public.estado_cita DEFAULT 'PROGRAMADA'::public.estado_cita NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    monto_pagado numeric(10,2)
);


--
-- Name: medical_history_audits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.medical_history_audits (
    id text NOT NULL,
    patient_id text NOT NULL,
    campo character varying(100) NOT NULL,
    valor_anterior text,
    valor_nuevo text,
    motivo text NOT NULL,
    usuario_id character varying(100),
    fecha_hora timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: patients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patients (
    id text NOT NULL,
    nombre character varying(150) NOT NULL,
    telefono character varying(20) NOT NULL,
    edad integer NOT NULL,
    examenes_sangre_validados boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    evidencia_archivo_nombre character varying(255),
    evidencia_archivo_url text,
    parametros_hematologicos text,
    fecha_validacion_examenes timestamp(3) without time zone
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id text NOT NULL,
    email character varying(150) NOT NULL,
    password character varying(255) NOT NULL,
    nombre character varying(150) NOT NULL,
    especialidad character varying(100) DEFAULT 'Odontología General'::character varying NOT NULL,
    rol character varying(50) DEFAULT 'ODONTOLOGO'::character varying NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
945614cb-1842-4e46-9887-fa016a7ab488	3e511d4b27c24bbccba89e5e9e9788a2eb603fed49537f4e6a9c195afc2f06e4	2026-10-13 19:44:47.457679+00	20261013194447_init_local_test_db	\N	\N	2026-10-13 19:44:47.44693+00	1
dedcdc92-0a37-42d1-b344-b2957a2e3db9	ebfb816fce7a29e4079e96750856d6331f0dacfed4bacd628d1d83eede3550b8	2026-10-14 04:20:56.651475+00	20261014021059_add_appointments	\N	\N	2026-10-14 04:20:56.577247+00	1
025edc53-9afe-4a42-aebc-b37f20708d6a	dedee5e9d57ff8ba05cabcd5abf241ebb202d6050847bc2eb35101b49cb9c299	2026-10-14 04:43:58.896857+00	20261014031425_add_antecedentes_medicos	\N	\N	2026-10-14 04:43:58.833627+00	1
42ffe214-67c9-43a5-aede-360138c094ff	f4545ebf940e0eee2bd3010bbef6e83746c8943cd5d975d223d5100676634c0b	2026-10-28 16:51:08.242791+00	20261017185000_add_blood_exam_evidence	\N	\N	2026-10-28 16:51:08.22948+00	1
2954cb5f-7f4f-49b4-91dc-d27bf661442c	1546c4685a1c5ad9fd5e3cb380c85a20b79a7146c31616a887911eb4127c6e64	2026-10-28 16:51:08.318801+00	20261017195000_add_medical_history_audit	\N	\N	2026-10-28 16:51:08.244363+00	1
598b1256-f5b7-4793-87bc-349c685adeba	65eac74ba253618c7d838174076b7dfc8748d72d0435676ac97a57b58e4d738a	2026-10-28 16:51:08.37752+00	20261017195000_add_users_table	\N	\N	2026-10-28 16:51:08.320341+00	1
f9b78f78-9a59-4e22-8a22-e1634dc9b037	6bcdcedaa4244ee8ae29e304d16fe7df20ab35abc645d8ddfb15fcb05148a3b4	2026-10-28 22:43:58.690376+00	20261028120000_add_appointment_payment	\N	\N	2026-10-28 22:43:58.677867+00	1
\.


--
-- Data for Name: antecedentes_medicos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.antecedentes_medicos (id, patient_id, tiene_diabetes, tipo_diabetes, tiene_hipertension, tiene_cardiopatia, toma_anticoagulantes, esta_embarazada, alergias, medicacion_actual, otras_condiciones, created_at, updated_at) FROM stdin;
68139f1b-4bb6-40e8-8481-9c8aa66b8c7b	26d31a4c-7c30-46f0-bd04-885e0b00fb85	t	TIPO_2	f	f	f	f	{Penicilina,Látex}	Metformina 850mg c/12h	\N	2026-10-14 04:44:12.499	2026-10-14 04:44:12.499
93045ada-be42-498f-95e6-2885c017105d	472edc48-ac13-4616-8408-1ba1fe4b64ff	f	\N	t	f	t	f	{Lidocaína}	Warfarina 5mg diario, Enalapril 10mg	Monitoreo de tiempo de sangría previo a procedimientos quirúrgicos	2026-10-14 04:44:12.516	2026-10-14 04:44:12.516
\.


--
-- Data for Name: appointments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.appointments (id, patient_id, motivo, fecha_inicio, fecha_fin, estado, created_at, updated_at, monto_pagado) FROM stdin;
f028e813-7409-4c41-931b-723b8f70c594	26d31a4c-7c30-46f0-bd04-885e0b00fb85	Limpieza dental profunda y profilaxis	2026-10-14 18:00:00	2026-10-14 19:00:00	ATENDIDA	2026-10-14 04:21:18.63	2026-10-14 04:21:18.63	\N
b1aaa2cd-d722-4661-aef6-1158bc44569a	949708d1-1255-4994-bc7d-fb31809b699c	Revisión general y diagnóstico de caries	2026-10-14 13:00:00	2026-10-14 14:00:00	ATENDIDA	2026-10-14 04:21:18.634	2026-10-14 04:21:18.634	\N
9f2cc062-11c2-4a69-8571-943561fef581	472edc48-ac13-4616-8408-1ba1fe4b64ff	Urgencia odontológica nocturna (dolor agudo)	2026-10-15 03:30:00	2026-10-15 03:55:00	PROGRAMADA	2026-10-14 04:21:18.636	2026-10-14 04:21:18.636	\N
ab5a1777-6cd3-4ab1-81cd-d5b9a7353633	5ea72ea2-f9ce-4ab4-83b5-519a789e1905	Extracción de tercer molar (Cancelada por paciente)	2026-10-14 15:30:00	2026-10-14 16:30:00	CANCELADA	2026-10-14 04:21:18.638	2026-10-14 04:21:18.638	\N
f2db452b-2ee6-44a8-b86d-350be2278a0d	26d31a4c-7c30-46f0-bd04-885e0b00fb85	Control y ajuste de ortodoncia (brackets)	2026-10-14 20:30:00	2026-10-14 21:30:00	PROGRAMADA	2026-10-14 04:21:18.64	2026-10-14 04:21:18.64	\N
abe0cb99-3ab1-46c4-8703-5cabcdb241c8	949708d1-1255-4994-bc7d-fb31809b699c	Inicio de tratamiento de conducto (Endodoncia)	2026-10-14 12:00:00	2026-10-14 12:45:00	PROGRAMADA	2026-10-14 04:21:18.641	2026-10-14 04:21:18.641	\N
1ee6253a-6383-4060-b14f-9b09b4c5b5dd	26d31a4c-7c30-46f0-bd04-885e0b00fb85	Limpieza dental profunda y profilaxis	2026-10-19 18:00:00	2026-10-19 19:00:00	ATENDIDA	2026-10-20 01:39:23.21	2026-10-20 01:39:23.21	\N
353e2cda-8bc7-4f90-9b6a-19f38af01b6e	472edc48-ac13-4616-8408-1ba1fe4b64ff	Revisión general y diagnóstico de caries	2026-10-19 13:00:00	2026-10-19 14:00:00	ATENDIDA	2026-10-20 01:39:23.262	2026-10-20 01:39:23.262	\N
d844bdab-aa16-416e-ae04-6804f0fca65f	5ea72ea2-f9ce-4ab4-83b5-519a789e1905	Urgencia odontológica nocturna (dolor agudo)	2026-10-20 03:30:00	2026-10-20 03:55:00	PROGRAMADA	2026-10-20 01:39:23.263	2026-10-20 01:39:23.263	\N
bde03600-3be3-4ad5-ba42-59ba3a31540a	949708d1-1255-4994-bc7d-fb31809b699c	Extracción de tercer molar (Cancelada por paciente)	2026-10-19 15:30:00	2026-10-19 16:30:00	CANCELADA	2026-10-20 01:39:23.265	2026-10-20 01:39:23.265	\N
8bd4b2ac-81fa-44b2-90b1-e43ecd668840	472edc48-ac13-4616-8408-1ba1fe4b64ff	Inicio de tratamiento de conducto (Endodoncia)	2026-10-19 12:00:00	2026-10-19 12:45:00	ATENDIDA	2026-10-20 01:39:23.268	2026-10-20 01:41:21.123	\N
6974f791-0c37-4e6f-81d9-5ec10f0a2d75	26d31a4c-7c30-46f0-bd04-885e0b00fb85	Control y ajuste de ortodoncia (brackets)	2026-10-19 20:30:00	2026-10-19 21:30:00	CANCELADA	2026-10-20 01:39:23.266	2026-10-20 01:42:06.875	\N
6fccc12a-fcbf-4d0b-b1d0-6cb74e9dfc52	472edc48-ac13-4616-8408-1ba1fe4b64ff	Limpieza profiláctica	2026-10-29 13:00:00	2026-10-29 13:45:00	ATENDIDA	2026-10-28 23:18:06.006	2026-10-28 23:24:02.72	150.00
885616cd-d8b5-41b4-b8b9-800bd7601b8e	472edc48-ac13-4616-8408-1ba1fe4b64ff	Limpieza profiláctica	2026-10-31 13:00:00	2026-10-31 13:45:00	ATENDIDA	2026-10-30 08:07:33.369	2026-10-30 08:26:21.275	200.00
\.


--
-- Data for Name: medical_history_audits; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.medical_history_audits (id, patient_id, campo, valor_anterior, valor_nuevo, motivo, usuario_id, fecha_hora) FROM stdin;
\.


--
-- Data for Name: patients; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.patients (id, nombre, telefono, edad, examenes_sangre_validados, created_at, updated_at, evidencia_archivo_nombre, evidencia_archivo_url, parametros_hematologicos, fecha_validacion_examenes) FROM stdin;
472edc48-ac13-4616-8408-1ba1fe4b64ff	Carlos Mendoza	73456789	45	t	2026-10-14 04:21:18.579	2026-10-14 04:21:18.579	\N	\N	\N	\N
949708d1-1255-4994-bc7d-fb31809b699c	Ana María Quispe	72345678	28	f	2026-10-14 04:21:18.579	2026-10-14 04:21:18.579	\N	\N	\N	\N
5ea72ea2-f9ce-4ab4-83b5-519a789e1905	Lucía Fernández	74567890	22	f	2026-10-14 04:21:18.579	2026-10-14 04:21:18.579	\N	\N	\N	\N
26d31a4c-7c30-46f0-bd04-885e0b00fb85	Juan Pérez	71234567	34	t	2026-10-14 04:21:18.579	2026-10-14 04:21:18.579	\N	\N	\N	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, password, nombre, especialidad, rol, created_at, updated_at) FROM stdin;
963f2799-8d88-42c0-a964-e2bbf00ec0be	dr.oropeza@gmail.com	$2b$10$9TbRR9E9sMdQmr7VK3MmHeXcxEGSNrCaMxQ8gvDLnQpRB/8Fi5uG2	Dr. Carlos Oropeza	Odontología General	ODONTOLOGO	2026-10-28 23:02:34.22	2026-10-28 23:02:34.22
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: antecedentes_medicos antecedentes_medicos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.antecedentes_medicos
    ADD CONSTRAINT antecedentes_medicos_pkey PRIMARY KEY (id);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: medical_history_audits medical_history_audits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medical_history_audits
    ADD CONSTRAINT medical_history_audits_pkey PRIMARY KEY (id);


--
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: antecedentes_medicos_patient_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX antecedentes_medicos_patient_id_key ON public.antecedentes_medicos USING btree (patient_id);


--
-- Name: appointments_fecha_inicio_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX appointments_fecha_inicio_idx ON public.appointments USING btree (fecha_inicio);


--
-- Name: medical_history_audits_patient_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX medical_history_audits_patient_id_idx ON public.medical_history_audits USING btree (patient_id);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: antecedentes_medicos antecedentes_medicos_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.antecedentes_medicos
    ADD CONSTRAINT antecedentes_medicos_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: appointments appointments_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: medical_history_audits medical_history_audits_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medical_history_audits
    ADD CONSTRAINT medical_history_audits_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict YFvIHVFwxrk0jWxDRe5N1mph8vJG9z9kE8NVfVgvQKjFsffFcwyzyf8V5D8DTw2

