import type { Metadata } from 'next';
import { cache } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Hero } from '@/components/portal/ui';
import { NotifyMe } from '@/components/portal/NotifyMe';
import { OpportunityAdmin } from '@/components/portal/OpportunityAdmin';
import { RegisterBar } from '@/components/portal/RegisterBar';
import { TAG_CLASS } from '@/components/portal/tags';
import { OPP_COLS, toOpp } from '@/lib/news';
import { createClient } from '@/lib/supabase/server';
import s from '@/styles/Portal.module.css';

/* the opportunity + four latest others from Supabase `opportunities`; cached so metadata and page share one fetch.
   Rendered on the server only for the text, so reading the clock for "2 hours ago" is safe here.
   Dates are shown by client components (NotifyMe) in the reader's own time zone. */
const getOpportunity = cache(async (slug: string) => {
  const supabase = createClient();
  const [one, more] = await Promise.all([
    supabase.from('opportunities').select(OPP_COLS).eq('slug', slug).maybeSingle(),
    supabase.from('opportunities').select(OPP_COLS).neq('slug', slug).order('published_at', { ascending: false }).limit(4),
  ]);
  const now = new Date();
  return { item: one.data ? toOpp(one.data, now) : null, related: (more.data ?? []).map((r) => toOpp(r, now)) };
});

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { item } = await getOpportunity(params.slug);
  return { title: item?.title ?? 'Opportunity' };
}

export default async function OpportunityPage({ params }: { params: { slug: string } }) {
  const { item, related } = await getOpportunity(params.slug);
  if (!item) notFound();

  return (
    <>
      <Link href="/dashboard/opportunities" className={s.back}>← All opportunities</Link>
      <Hero eyebrow={`${item.kind} · ${item.source}`} title={item.title} desc={item.meta} />

      <div className={s.article}>
        <article className={s.card} style={{ padding: 'clamp(20px, 3vw, 36px)' }}>
          <div className={s.articleImg} data-reveal>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.img} alt="" />
          </div>
          <div className={s.articleBody}>
            <p className={s.articleLead} data-reveal>{item.excerpt}</p>
            {item.body.map((para, i) => <p key={i} data-reveal>{para}</p>)}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 28 }} data-reveal>
            <span className={`${s.tag} ${TAG_CLASS[item.kind]}`}>{item.kind}</span>
            <span className={`${s.tag} ${s.tMuted}`}>{item.source}</span>
          </div>
          <RegisterBar id={item.id} applyUrl={item.applyUrl} />
          <NotifyMe kind="opportunity" id={item.id} eventAt={item.eventAt} />
          <OpportunityAdmin item={item} />
        </article>

        <aside className={`${s.card} ${s.sticky}`} data-reveal>
          <div className={s.cardHead}>
            <div>
              <p className={s.cardEyebrow}>Keep looking</p>
              <h2 className={s.cardTitle}>More opportunities</h2>
            </div>
          </div>
          <div className={s.related}>
            {related.map((o) => (
              <Link key={o.slug} href={`/dashboard/opportunities/${o.slug}`} className={s.relatedItem}>
                <span className={s.relatedImg}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={o.img} alt="" loading="lazy" />
                </span>
                <span>
                  <span className={s.relatedTitle} style={{ display: 'block' }}>{o.title}</span>
                  <span className={s.cardMeta}>{o.kind} · {o.meta}</span>
                </span>
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </>
  );
}
