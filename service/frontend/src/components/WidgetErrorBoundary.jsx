import { Component } from 'react'
import { AlertCircle } from 'lucide-react'

export default class WidgetErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidUpdate(previousProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null })
    }
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="h-full rounded-xl border border-red-100 bg-white shadow-sm flex flex-col items-center justify-center gap-2 px-5 text-center">
        <AlertCircle size={18} className="text-red-500" />
        <p className="text-xs font-medium text-gray-700">이 차트를 표시하지 못했습니다.</p>
        <p className="text-[11px] text-gray-400 break-all">{this.state.error.message}</p>
      </div>
    )
  }
}
