import { useEffect } from 'react';
import { LevelPill } from '../components/Status';
import { GUIDE, LEVEL_HELP, SOURCES, type GuideBlock } from '../data/guide';
import { PARAMS, PARAM_IDS } from '../data/parameters';
import { PROFILES, PROFILE_IDS } from '../data/profiles';
import { useI18n } from '../i18n';
import { formatRange } from '../lib/units';
import { useAppData } from '../store';

const LEVELS = ['ok', 'warn', 'bad', 'cycling'] as const;

function Block({ block }: { block: GuideBlock }) {
  const { l } = useI18n();
  if (block.type === 'p') return <p>{l(block.text)}</p>;
  if (block.type === 'h3') return <h3>{l(block.text)}</h3>;
  const items = block.items.map((item) => <li key={item.en}>{l(item)}</li>);
  return block.type === 'ol' ? <ol className="steps">{items}</ol> : <ul className="bullets">{items}</ul>;
}

export function Guide() {
  const { t, l, lang } = useI18n();
  const { settings } = useAppData();

  useEffect(() => {
    document.title = `${t('guide.title')} · Veyqua`;
  }, [t]);

  // Links such as /guide#sources arrive without a page load, so jump to the section ourselves.
  useEffect(() => {
    if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
  }, []);

  const contents = [
    ...GUIDE.map((section) => ({ id: section.id, title: l(section.title) })),
    { id: 'colours', title: t('guide.colours') },
    { id: 'parameters', title: t('guide.params') },
    { id: 'sources', title: t('guide.sources') },
  ];

  return (
    <div className="page page-narrow guide">
      <h1>{t('guide.title')}</h1>
      <p className="lead">{t('guide.intro')}</p>
      <nav className="card card-soft toc" aria-labelledby="toc-title">
        <h2 id="toc-title">{t('guide.contents')}</h2>
        <ol>
          {contents.map((item) => (
            <li key={item.id}>
              <a href={`#${item.id}`}>{item.title}</a>
            </li>
          ))}
        </ol>
      </nav>

      {GUIDE.map((section) => (
        <section key={section.id} id={section.id} className="guide-section" aria-labelledby={`${section.id}-title`}>
          <h2 id={`${section.id}-title`}>{l(section.title)}</h2>
          {section.blocks.map((block, index) => (
            <Block key={index} block={block} />
          ))}
        </section>
      ))}

      <section id="colours" className="guide-section" aria-labelledby="colours-title">
        <h2 id="colours-title">{t('guide.colours')}</h2>
        <dl className="legend">
          {LEVELS.map((level) => (
            <div key={level}>
              <dt>
                <LevelPill level={level} />
              </dt>
              <dd>{l(LEVEL_HELP[level])}</dd>
            </div>
          ))}
        </dl>
        <p>{t('guide.coloursTargets')}</p>
      </section>

      <section id="parameters" className="guide-section" aria-labelledby="parameters-title">
        <h2 id="parameters-title">{t('guide.params')}</h2>
        <p>{t('guide.paramsIntro')}</p>
        {PARAM_IDS.map((param) => {
          const def = PARAMS[param];
          const profiles = PROFILE_IDS.filter((id) => PROFILES[id].targets[param]);
          return (
            <details key={param} className="disclosure">
              <summary>
                {l(def.name)}
                {def.symbol && <span className="muted"> {def.symbol}</span>}
              </summary>
              <p>{l(def.about)}</p>
              {profiles.length > 0 && (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th scope="col">{t('guide.tankType')}</th>
                        <th scope="col">{t('guide.ideal')}</th>
                        <th scope="col">{t('guide.tolerable')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profiles.map((id) => {
                        const target = PROFILES[id].targets[param]!;
                        return (
                          <tr key={id}>
                            <th scope="row">{l(PROFILES[id].name)}</th>
                            <td>{formatRange(param, target.ideal, settings, lang)}</td>
                            <td>{formatRange(param, target.acceptable, settings, lang)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </details>
          );
        })}
      </section>

      <section id="sources" className="guide-section" aria-labelledby="sources-title">
        <h2 id="sources-title">{t('guide.sources')}</h2>
        <p>{t('guide.sourcesIntro')}</p>
        {SOURCES.map((group) => (
          <div key={group.topic.en}>
            <h3>{l(group.topic)}</h3>
            <ul className="sources">
              {group.items.map((source) => (
                <li key={source.url}>
                  <a href={source.url} target="_blank" rel="noopener">
                    {source.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <p className="card card-soft disclaimer">{t('guide.disclaimer')}</p>
      </section>
    </div>
  );
}
