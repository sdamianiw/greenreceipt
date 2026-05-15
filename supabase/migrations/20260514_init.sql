-- Phase 01 Core Loop · T3.1 · GreenReceipt V1.0
-- Migration: initial scans table + deny-all anon RLS
-- Date: 2026-05-15
-- REQ trace: NF-02, S-03, S-05, A-06
-- FAILURE refs: #3 (no claim_text column), #4 (RLS inline)

create extension if not exists pgcrypto;

create table public.scans (
  id            uuid          primary key default gen_random_uuid(),
  device_id     uuid          not null,
  verdict       text          not null check (verdict in ('Vague', 'Verifiable', 'Unsupported', 'Substantiated')),
  confidence    numeric(3, 2) not null check (confidence between 0 and 1),
  model_used    text          not null,
  tokens_used   int           not null check (tokens_used >= 0),
  created_at    timestamptz   not null default now()
);

create index scans_device_id_created_at_idx
  on public.scans (device_id, created_at desc);

alter table public.scans enable row level security;

-- Deny-all anon: no policies. Edge Function uses service_role for all r/w.
