import { Sheet } from './Sheet'
import { usePWA } from '../hooks/usePWA'

type Props = { open: boolean; onClose: () => void }

/**
 * Install-instructions sheet. Uses the platform-appropriate flow:
 *   - Android/Chrome: native prompt via beforeinstallprompt
 *   - iOS: instructions to use Share → Add to Home Screen
 *   - Desktop: address bar install icon
 */
export function PWAInstallSheet({ open, onClose }: Props) {
  const { canInstall, install, platform, isInstalled } = usePWA()

  if (isInstalled) {
    return (
      <Sheet open={open} onClose={onClose} eyebrow="INSTALLED" title="이미 설치됨">
        <div className="text-center py-6">
          <div className="text-5xl mb-3">✓</div>
          <div className="text-cathedral-parchment/85 font-serif">
            Sagrada는 이미 앱으로 설치되어 있어요.
          </div>
        </div>
      </Sheet>
    )
  }

  return (
    <Sheet open={open} onClose={onClose} eyebrow="INSTALL" title="앱으로 설치하기">
      <div className="space-y-4">
        <div className="glass-panel rounded-2xl p-5 text-center">
          <img src="/icon-192.png" alt="Sagrada" className="w-16 h-16 mx-auto rounded-2xl shadow-gold-glow" />
          <div className="font-display text-lg text-gold-shimmer mt-3">Sagrada Online</div>
          <div className="text-xs text-cathedral-parchment/60 mt-1 font-serif italic">
            홈 화면에 아이콘 추가 · 전체화면으로 실행
          </div>
        </div>

        {canInstall && (
          <button
            onClick={async () => { await install(); onClose() }}
            className="w-full bg-gold-gradient text-cathedral-void font-serif font-bold text-lg tracking-widest
                       py-3.5 rounded-lg shadow-gold-glow hover:brightness-110 active:scale-[0.98] transition"
          >
            ✧ INSTALL NOW ✧
          </button>
        )}

        {platform === 'ios' && (
          <div className="space-y-3">
            <div className="text-xs tracking-widest text-cathedral-gold/70 text-center">
              📱 iOS SAFARI · 3 단계
            </div>
            <IosStep n={1} icon="⬆︎" title="공유 버튼 탭" body="주소창 옆(또는 하단 가운데)의 공유 아이콘을 눌러요." />
            <IosStep n={2} icon="＋" title="'홈 화면에 추가' 선택" body="공유 메뉴를 스크롤해서 '홈 화면에 추가'를 찾아 탭." />
            <IosStep n={3} icon="✓" title="추가" body="이름 확인 후 우상단 '추가' 눌러 완료. 이제 홈 화면 아이콘으로 실행하세요." />
          </div>
        )}

        {platform === 'android' && !canInstall && (
          <div className="text-sm text-cathedral-parchment/80 font-serif leading-relaxed text-center bg-cathedral-void/50 rounded-xl p-4 border border-cathedral-gold/20">
            Chrome 메뉴(⋮) → <b>홈 화면에 추가</b> 로 설치할 수 있어요.
          </div>
        )}

        {platform === 'desktop' && !canInstall && (
          <div className="text-sm text-cathedral-parchment/80 font-serif leading-relaxed text-center bg-cathedral-void/50 rounded-xl p-4 border border-cathedral-gold/20">
            브라우저 주소창 오른쪽의 <b>설치 아이콘</b>을 눌러 앱으로 설치할 수 있어요.
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full border border-cathedral-parchment/25 text-cathedral-parchment/70 font-serif tracking-widest text-xs
                     py-2.5 rounded-lg hover:bg-cathedral-parchment/10 transition"
        >
          나중에
        </button>
      </div>
    </Sheet>
  )
}

function IosStep({ n, icon, title, body }: { n: number; icon: string; title: string; body: string }) {
  return (
    <div className="glass-panel rounded-xl p-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-cathedral-gold text-cathedral-void font-display font-black text-lg flex items-center justify-center shrink-0">
        {n}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <div className="font-serif text-cathedral-parchment text-sm font-semibold">{title}</div>
        </div>
        <div className="text-xs text-cathedral-parchment/70 leading-snug">{body}</div>
      </div>
    </div>
  )
}
