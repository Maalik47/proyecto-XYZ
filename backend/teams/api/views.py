from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from ..models import Team, TeamMember
from .serializers import TeamSerializer, TeamDetailSerializer, TeamMemberSerializer


class TeamViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'admin':
            return Team.objects.all().distinct()
        return Team.objects.filter(members__user=self.request.user).distinct()

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return TeamDetailSerializer
        return TeamSerializer

    def create(self, request, *args, **kwargs):
        if not request.user.can_create_teams:
            return Response(
                {'error': 'Solo administradores y profesores pueden crear equipos'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        team = serializer.save(created_by=self.request.user)
        TeamMember.objects.create(team=team, user=self.request.user, role='owner')

    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        team = self.get_object()
        user_id = request.data.get('user_id')
        role = request.data.get('role', 'member')
        
        if TeamMember.objects.filter(team=team, user_id=user_id).exists():
            return Response({'error': 'El usuario ya es miembro del equipo'}, status=status.HTTP_400_BAD_REQUEST)
        
        membership = team.members.filter(user=request.user).first()
        if membership and membership.role in ['owner', 'admin', 'professor']:
            TeamMember.objects.create(team=team, user_id=user_id, role=role)
            return Response({'message': 'Miembro agregado'}, status=status.HTTP_201_CREATED)
        return Response({'error': 'No tienes permisos'}, status=status.HTTP_403_FORBIDDEN)

    @action(detail=True, methods=['delete'])
    def remove_member(self, request, pk=None):
        team = self.get_object()
        user_id = request.data.get('user_id')
        
        membership = team.members.filter(user=request.user).first()
        if membership and membership.role in ['owner', 'admin']:
            TeamMember.objects.filter(team=team, user_id=user_id).delete()
            return Response({'message': 'Miembro eliminado'}, status=status.HTTP_204_NO_CONTENT)
        return Response({'error': 'No tienes permisos'}, status=status.HTTP_403_FORBIDDEN)

    @action(detail=True, methods=['delete'])
    def leave_team(self, request, pk=None):
        team = self.get_object()
        membership = team.members.filter(user=request.user).first()
        if not membership:
            return Response({'error': 'No eres miembro de este equipo'}, status=status.HTTP_404_NOT_FOUND)
        if membership.role == 'owner':
            return Response({'error': 'El propietario no puede abandonar el equipo'}, status=status.HTTP_400_BAD_REQUEST)
        membership.delete()
        return Response({'message': 'Has salido del equipo'}, status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        try:
            team = self.get_object()
            members = team.members.all()
            serializer = TeamMemberSerializer(members, many=True)
            return Response(serializer.data)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
