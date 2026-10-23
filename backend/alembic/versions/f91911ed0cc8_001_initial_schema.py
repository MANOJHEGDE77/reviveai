"""001_initial_schema

Revision ID: f91911ed0cc8
Revises: 
Create Date: 2026-10-23 21:19:29.945373

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'f91911ed0cc8'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = inspector.get_table_names()

    if 'idempotency_records' not in tables:
        op.create_table('idempotency_records',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('idempotency_key', sa.String(length=128), nullable=False),
            sa.Column('endpoint', sa.String(length=256), nullable=False),
            sa.Column('request_hash', sa.String(length=64), nullable=False),
            sa.Column('status', sa.String(length=32), nullable=False),
            sa.Column('response_code', sa.Integer(), nullable=True),
            sa.Column('response_body', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_idempotency_records_id'), 'idempotency_records', ['id'], unique=False)
        op.create_index(op.f('ix_idempotency_records_idempotency_key'), 'idempotency_records', ['idempotency_key'], unique=True)
        op.create_index(op.f('ix_idempotency_records_status'), 'idempotency_records', ['status'], unique=False)

    payment_cols = [c['name'] for c in inspector.get_columns('payments')]
    if 'diagnosis_source' not in payment_cols:
        op.add_column('payments', sa.Column('diagnosis_source', sa.String(length=64), server_default="DETERMINISTIC_HEURISTIC", nullable=False))
    if 'is_simulated' not in payment_cols:
        op.add_column('payments', sa.Column('is_simulated', sa.Boolean(), server_default="1", nullable=False))
    if 'settlement_evidence' not in payment_cols:
        op.add_column('payments', sa.Column('settlement_evidence', sa.String(length=512), nullable=True))

    action_cols = [c['name'] for c in inspector.get_columns('recovery_actions')]
    if 'provider' not in action_cols:
        op.add_column('recovery_actions', sa.Column('provider', sa.String(length=64), server_default="SIMULATION", nullable=False))
    if 'provider_action_ref' not in action_cols:
        op.add_column('recovery_actions', sa.Column('provider_action_ref', sa.String(length=128), nullable=True))
    if 'is_simulated' not in action_cols:
        op.add_column('recovery_actions', sa.Column('is_simulated', sa.Boolean(), server_default="1", nullable=False))
    if 'idempotency_key' not in action_cols:
        op.add_column('recovery_actions', sa.Column('idempotency_key', sa.String(length=128), nullable=True))
        op.create_index(op.f('ix_recovery_actions_idempotency_key'), 'recovery_actions', ['idempotency_key'], unique=False)

    wf_cols = [c['name'] for c in inspector.get_columns('recovery_workflows')]
    if 'scheduled_execution_at' not in wf_cols:
        op.add_column('recovery_workflows', sa.Column('scheduled_execution_at', sa.DateTime(), nullable=True))
    if 'is_simulated' not in wf_cols:
        op.add_column('recovery_workflows', sa.Column('is_simulated', sa.Boolean(), server_default="1", nullable=False))
    if 'idempotency_key' not in wf_cols:
        op.add_column('recovery_workflows', sa.Column('idempotency_key', sa.String(length=128), nullable=True))
        op.create_index(op.f('ix_recovery_workflows_idempotency_key'), 'recovery_workflows', ['idempotency_key'], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = inspector.get_table_names()

    if 'recovery_workflows' in tables:
        wf_cols = [c['name'] for c in inspector.get_columns('recovery_workflows')]
        if 'idempotency_key' in wf_cols:
            op.drop_index(op.f('ix_recovery_workflows_idempotency_key'), table_name='recovery_workflows')
            op.drop_column('recovery_workflows', 'idempotency_key')
        if 'is_simulated' in wf_cols:
            op.drop_column('recovery_workflows', 'is_simulated')
        if 'scheduled_execution_at' in wf_cols:
            op.drop_column('recovery_workflows', 'scheduled_execution_at')

    if 'recovery_actions' in tables:
        action_cols = [c['name'] for c in inspector.get_columns('recovery_actions')]
        if 'idempotency_key' in action_cols:
            op.drop_index(op.f('ix_recovery_actions_idempotency_key'), table_name='recovery_actions')
            op.drop_column('recovery_actions', 'idempotency_key')
        if 'is_simulated' in action_cols:
            op.drop_column('recovery_actions', 'is_simulated')
        if 'provider_action_ref' in action_cols:
            op.drop_column('recovery_actions', 'provider_action_ref')
        if 'provider' in action_cols:
            op.drop_column('recovery_actions', 'provider')

    if 'payments' in tables:
        payment_cols = [c['name'] for c in inspector.get_columns('payments')]
        if 'settlement_evidence' in payment_cols:
            op.drop_column('payments', 'settlement_evidence')
        if 'is_simulated' in payment_cols:
            op.drop_column('payments', 'is_simulated')
        if 'diagnosis_source' in payment_cols:
            op.drop_column('payments', 'diagnosis_source')

    if 'idempotency_records' in tables:
        op.drop_index(op.f('ix_idempotency_records_status'), table_name='idempotency_records')
        op.drop_index(op.f('ix_idempotency_records_idempotency_key'), table_name='idempotency_records')
        op.drop_index(op.f('ix_idempotency_records_id'), table_name='idempotency_records')
        op.drop_table('idempotency_records')
