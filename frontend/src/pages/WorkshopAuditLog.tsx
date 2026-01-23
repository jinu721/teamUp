import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuditLogFilters } from '@/types/workshop';
import { useWorkshop } from '@/hooks/useWorkshops';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuditLogViewer } from '@/components/workshop';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, FileText } from 'lucide-react';

const WorkshopAuditLog: React.FC = () => {
  const { workshopId } = useParams<{ workshopId: string }>();
  const navigate = useNavigate();
  const { workshop, loading: workshopLoading } = useWorkshop(workshopId);
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const { logs, loading, hasMore, loadMore } = useAuditLogs(workshopId, filters);

  if (workshopLoading) {
    return (
      <AppLayout>
        <div className="page-container space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!workshop) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-16">
          <h2 className="text-xl font-semibold mb-2">Workshop not found</h2>
          <Button onClick={() => navigate('/workshops')}>Back to Workshops</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="page-container space-y-6">

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/workshops/${workshopId}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Audit Log
            </h1>
            <p className="text-muted-foreground">
              Activity history for {workshop.name}
            </p>
          </div>
        </div>

        <AuditLogViewer
          logs={logs}
          loading={loading}
          hasMore={hasMore}
          filters={filters}
          onFilterChange={setFilters}
          onLoadMore={loadMore}
        />
      </div>
    </AppLayout>
  );
};

export default WorkshopAuditLog;