import { useMutation, useQuery } from '@apollo/client';
import { GET_CLIENT_SEGMENTS, GET_CLIENT_SEGMENT, GET_CLIENTS_IN_SEGMENT } from '../graphql/queries/clientSegments';
import { CREATE_CLIENT_SEGMENT, UPDATE_CLIENT_SEGMENT, DELETE_CLIENT_SEGMENT } from '../graphql/mutations/clientSegments';
import { toast } from '@/src/components/ui/sonner';
import { useWorkspace } from './useWorkspace';
import { useErrorHandler } from './useErrorHandler';

export const useClientSegments = () => {
  const { workspaceId, loading: workspaceLoading } = useWorkspace();

  const { data, loading: queryLoading, error, refetch } = useQuery(GET_CLIENT_SEGMENTS, {
    variables: { workspaceId },
    skip: !workspaceId,
    fetchPolicy: 'network-only',
  });

  return {
    segments: data?.clientSegments || [],
    loading: (workspaceLoading && !workspaceId) || (queryLoading && !data?.clientSegments),
    error,
    refetch,
  };
};

export const useClientSegment = (id) => {
  const { workspaceId, loading: workspaceLoading } = useWorkspace();

  const { data, loading: queryLoading, error } = useQuery(GET_CLIENT_SEGMENT, {
    variables: { workspaceId, id },
    skip: !id || !workspaceId,
  });

  return {
    segment: data?.clientSegment,
    loading: (workspaceLoading && !workspaceId) || (queryLoading && !data?.clientSegment),
    error,
  };
};

export const useClientsInSegment = (segmentId, page = 1, limit = 10, search = '') => {
  const { workspaceId, loading: workspaceLoading } = useWorkspace();

  const { data, loading: queryLoading, error, refetch } = useQuery(GET_CLIENTS_IN_SEGMENT, {
    variables: { workspaceId, segmentId, page, limit, search },
    skip: !segmentId || !workspaceId,
    fetchPolicy: 'network-only',
  });

  return {
    clients: data?.clientsInSegment?.items || [],
    totalItems: data?.clientsInSegment?.totalItems || 0,
    currentPage: data?.clientsInSegment?.currentPage || 1,
    totalPages: data?.clientsInSegment?.totalPages || 1,
    loading: (workspaceLoading && !workspaceId) || (queryLoading && !data?.clientsInSegment),
    error,
    refetch,
  };
};

export const useCreateClientSegment = () => {
  const { workspaceId } = useWorkspace();
  const { handleMutationError } = useErrorHandler();

  const [createSegment, { loading, error }] = useMutation(CREATE_CLIENT_SEGMENT, {
    refetchQueries: [{ query: GET_CLIENT_SEGMENTS, variables: { workspaceId } }],
    awaitRefetchQueries: false,
    onCompleted: () => {
      toast.success('Segment créé');
    },
    onError: (error) => {
      handleMutationError(error, 'create', 'segment');
    },
  });

  return {
    createSegment: (input) => createSegment({ variables: { workspaceId, input } }),
    loading,
    error,
  };
};

export const useUpdateClientSegment = () => {
  const { workspaceId } = useWorkspace();
  const { handleMutationError } = useErrorHandler();

  const [updateSegment, { loading, error }] = useMutation(UPDATE_CLIENT_SEGMENT, {
    refetchQueries: [{ query: GET_CLIENT_SEGMENTS, variables: { workspaceId } }],
    awaitRefetchQueries: false,
    onCompleted: () => {
      toast.success('Segment modifié');
    },
    onError: (error) => {
      handleMutationError(error, 'update', 'segment');
    },
  });

  return {
    updateSegment: (id, input) => updateSegment({ variables: { workspaceId, id, input } }),
    loading,
    error,
  };
};

export const useDeleteClientSegment = () => {
  const { workspaceId } = useWorkspace();
  const { handleMutationError } = useErrorHandler();

  const [deleteSegment, { loading, error }] = useMutation(DELETE_CLIENT_SEGMENT, {
    refetchQueries: [{ query: GET_CLIENT_SEGMENTS, variables: { workspaceId } }],
    awaitRefetchQueries: false,
    onCompleted: () => {
      toast.success('Segment supprimé');
    },
    onError: (error) => {
      handleMutationError(error, 'delete', 'segment');
    },
  });

  return {
    deleteSegment: (id) => deleteSegment({ variables: { workspaceId, id } }),
    loading,
    error,
  };
};
