create index if not exists ai_knowledge_articles_fts_english_idx
on public.ai_knowledge_articles using gin (
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(body, ''))
)
where status = 'published' and locale = 'en';

create or replace function public.match_ai_knowledge_articles(
  query_text text,
  requested_locale text default 'en',
  match_count integer default 6
)
returns table (
  slug text,
  title text,
  category text,
  locale text,
  summary text,
  body text,
  keywords text[],
  relevance real
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  with search as (
    select
      case
        when requested_locale = 'hi' then websearch_to_tsquery('simple', coalesce(query_text, ''))
        else websearch_to_tsquery('english', coalesce(query_text, ''))
      end as query,
      case when requested_locale = 'hi' then 'simple'::regconfig else 'english'::regconfig end as config,
      regexp_split_to_array(lower(coalesce(query_text, '')), '[^[:alnum:]]+') as terms
  ), ranked as (
    select
      article.slug,
      article.title,
      article.category,
      article.locale,
      article.summary,
      article.body,
      article.keywords,
      (
        ts_rank_cd(
          to_tsvector(search.config, article.title || ' ' || article.summary || ' ' || article.body),
          search.query
        )
        + case when article.keywords && search.terms then 0.15 else 0 end
        + case when lower(article.title) like '%' || lower(trim(coalesce(query_text, ''))) || '%' then 0.2 else 0 end
      )::real as relevance
    from public.ai_knowledge_articles article
    cross join search
    where article.status = 'published'
      and article.locale = case when requested_locale = 'hi' then 'hi' else 'en' end
      and (
        numnode(search.query) = 0
        or to_tsvector(search.config, article.title || ' ' || article.summary || ' ' || article.body) @@ search.query
        or article.keywords && search.terms
      )
  )
  select *
  from ranked
  order by relevance desc, title
  limit greatest(1, least(coalesce(match_count, 6), 10));
$$;

revoke all on function public.match_ai_knowledge_articles(text, text, integer) from public, anon;
grant execute on function public.match_ai_knowledge_articles(text, text, integer) to authenticated;
