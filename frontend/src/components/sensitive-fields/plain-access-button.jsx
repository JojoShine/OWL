
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import PlainAccessDialog from './plain-access-dialog';
import { toast } from '@/components/ui/toast';

export default function PlainAccessButton({ 
  tableName, 
  fieldName, 
  recordId,
  onSuccess 
}) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleClick = () => {
    setDialogOpen(true);
  };

  const handleSuccess = () => {
    toast.success('已授权查看该记录的明文，有效期1小时');
    onSuccess?.();
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        className="h-8 px-2"
        title="申请查看明文"
      >
        <Eye className="h-4 w-4" />
      </Button>

      <PlainAccessDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        tableName={tableName}
        fieldName={fieldName}
        recordId={recordId}
        onSuccess={handleSuccess}
      />
    </>
  );
}
