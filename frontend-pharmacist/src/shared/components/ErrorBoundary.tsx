import { Component, type ErrorInfo, type ReactNode } from 'react';
import { FaExclamationTriangle, FaSync } from 'react-icons/fa';

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleRefresh = () => {
        window.location.href = '/';
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-[400px] flex items-center justify-center p-8">
                    <div className="max-w-md w-full text-center space-y-6 bg-red-50 p-10 rounded-3xl border border-red-100">
                        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                            <FaExclamationTriangle className="w-10 h-10" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Patient Data Safety Alert</h2>
                            <p className="text-gray-600 mt-2 text-sm leading-relaxed">
                                A clinical application error occurred. To ensure medical record integrity, please return to the dashboard.
                            </p>
                        </div>
                        <button
                            onClick={this.handleRefresh}
                            className="inline-flex items-center gap-2 bg-red-600 text-white px-8 py-3 rounded-full font-bold hover:bg-red-700 transition-all shadow-md active:scale-95"
                        >
                            <FaSync className="animate-spin-slow" /> Return to Dashboard
                        </button>
                        {this.state.error && (
                            <div className="pt-4 border-t border-red-100 mt-4">
                                <p className="text-[10px] text-red-300 font-mono uppercase tracking-widest truncate">
                                    Clinical Error ID: {this.state.error.message}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
