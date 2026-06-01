import { useSelector, type TypedUseSelectorHook } from 'react-redux'
import type { RootState } from '../store/index'

// verbatimModuleSyntax 환경에서 명시적 타입 지정
const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

export { useAppSelector }
