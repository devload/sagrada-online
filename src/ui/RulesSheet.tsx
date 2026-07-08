import { Sheet } from './Sheet'

export function RulesSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} eyebrow="HOW TO PLAY" title="Sagrada Rules">
      <div className="space-y-5 pb-4">
        <RuleBlock
          icon="🎲"
          title="드래프트 (Drafting)"
          body="매 라운드마다 (플레이어 수 × 2 + 1)개의 주사위가 굴려져 트레이에 놓입니다. 순서대로 1개씩 골라 자기 창문에 배치하세요."
        />
        <RuleBlock
          icon="🪟"
          title="배치 규칙 (Placement)"
          body={<>
            <div>• 창문의 <b>모서리/변</b>부터 시작</div>
            <div>• 이후엔 <b>이미 놓인 주사위와 접한 칸</b>에만 배치</div>
            <div>• 같은 <b>색</b> or 같은 <b>숫자</b>는 상하좌우 인접 불가</div>
            <div>• 패턴카드의 색/숫자 제약 준수</div>
          </>}
        />
        <RuleBlock
          icon="✦"
          title="목표 카드 (Objectives)"
          body="공용 목표 3장은 모두에게 공개. 개인 목표 1장은 나만 봄. 게임 종료 시 조건 만족한 만큼 득점."
        />
        <RuleBlock
          icon="⚒"
          title="도구 카드 (Tool Cards)"
          body={<>
            3장의 도구 카드가 게임마다 랜덤. <span className="text-cathedral-candle">Favor Token ◈</span>을 지불해 특수 능력 사용.
            첫 사용 1개, 두 번째부터 2개 소모.
          </>}
        />
        <RuleBlock
          icon="🏆"
          title="점수 계산"
          body={<>
            <div>+ 공용 목표 조건 만족</div>
            <div>+ 개인 목표 (내 색 주사위 값 합)</div>
            <div>+ 남은 Favor Token</div>
            <div>− 배치 못한 빈 칸당 <b>-1</b></div>
          </>}
        />

        <div className="glass-panel rounded-xl p-4 text-center">
          <div className="text-cathedral-candle text-2xl mb-2">✧</div>
          <div className="text-sm font-serif text-cathedral-parchment mb-1">처음이신가요?</div>
          <div className="text-xs text-cathedral-parchment/70">
            로비에서 <b className="text-cathedral-gold">Try Demo</b>를 눌러 3라운드 연습 게임을 해보세요.
          </div>
        </div>
      </div>
    </Sheet>
  )
}

function RuleBlock({ icon, title, body }: { icon: string; title: string; body: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="w-10 h-10 rounded-lg bg-cathedral-nave border border-cathedral-gold/30 flex items-center justify-center text-xl shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <div className="font-serif text-cathedral-parchment font-semibold mb-1">{title}</div>
        <div className="text-xs text-cathedral-parchment/75 leading-relaxed space-y-0.5">{body}</div>
      </div>
    </div>
  )
}
