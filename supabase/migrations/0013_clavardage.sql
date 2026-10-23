-- Clavardage d'équipe : discussion de groupe en temps réel, en remplacement
-- du groupe Messenger utilisé jusqu'ici.

create table if not exists public.messages_chat (
  id uuid primary key default gen_random_uuid(),
  auteur_id uuid not null references public.profiles (id) on delete cascade,
  contenu text not null,
  created_at timestamptz not null default now()
);

alter table public.messages_chat enable row level security;

create policy "Messages visibles par les employés connectés"
  on public.messages_chat for select
  to authenticated
  using (true);

create policy "Un employé envoie un message en son propre nom"
  on public.messages_chat for insert
  to authenticated
  with check (auteur_id = auth.uid());

create policy "Un administrateur peut supprimer un message"
  on public.messages_chat for delete
  to authenticated
  using (public.is_admin());

create index if not exists messages_chat_created_at_idx on public.messages_chat (created_at);

-- Active la diffusion en temps réel des nouveaux messages.
alter publication supabase_realtime add table public.messages_chat;
