interface Props {
  message: string;
  type: 'info' | 'success' | 'error';
  onClose: () => void;
}

const styles = {
  info:    'bg-blue-50 border-blue-200 text-blue-800',
  success: 'bg-green-50 border-green-200 text-green-800',
  error:   'bg-red-50 border-red-200 text-red-800',
};

const icons = { info: 'ℹ️', success: '✅', error: '❌' };

export default function StatusMessage({ message, type, onClose }: Props) {
  return (
    <div className={`flex items-start gap-2 border rounded-lg px-4 py-3 text-sm ${styles[type]}`}>
      <span>{icons[type]}</span>
      <p className="flex-1">{message}</p>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100 transition-opacity">✕</button>
    </div>
  );
}
