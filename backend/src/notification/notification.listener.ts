import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { NOTIFICATION_EVENTS } from './events/notification-event-names';
import type {
  CommentCreatedNotificationEvent,
  FollowUpRequiredNotificationEvent,
  IdeaStatusChangedNotificationEvent,
  ProblemStatusChangedNotificationEvent,
  SimilarFoundNotificationEvent,
  SimilarItemDetectedNotificationEvent,
  StatusChangedNotificationEvent,
  SupporterAddedNotificationEvent,
} from './events/notification.events';
import { NotificationDispatchService } from './notification-dispatch.service';

@Injectable()
export class NotificationListener {
  constructor(private readonly dispatchService: NotificationDispatchService) {}

  @OnEvent(NOTIFICATION_EVENTS.COMMENT_CREATED, { async: true })
  async handleCommentCreated(
    event: CommentCreatedNotificationEvent,
  ): Promise<void> {
    await this.dispatchService.dispatch({
      recipientUserId: event.recipientUserId,
      preferenceKey: 'newComments',
      notificationType: NOTIFICATION_EVENTS.COMMENT_CREATED,
      payload: {
        commentId: event.commentId,
        entityType: event.entityType,
        entityId: event.entityId,
        entityTitle: event.entityTitle,
        actorId: event.actorId,
        actorName: event.actorName,
        contentSnippet: event.contentSnippet,
      },
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.STATUS_CHANGED, { async: true })
  async handleStatusChanged(
    event: StatusChangedNotificationEvent,
  ): Promise<void> {
    const notificationType =
      event.entityType === 'idea'
        ? NOTIFICATION_EVENTS.IDEA_STATUS_CHANGED
        : NOTIFICATION_EVENTS.PROBLEM_STATUS_CHANGED;

    const recipientIds = [...new Set(event.recipientUserIds)].filter(
      userId => userId !== event.actorId,
    );

    for (const recipientUserId of recipientIds) {
      const payload =
        event.entityType === 'idea'
          ? {
              ideaId: event.entityId,
              ideaTitle: event.entityTitle,
              actorId: event.actorId,
              actorName: event.actorName,
              previousStatus: event.previousStatus,
              previousStage: event.previousStage,
              nextStatus: event.nextStatus,
              nextStage: event.nextStage,
            }
          : {
              problemId: event.entityId,
              problemTitle: event.entityTitle,
              actorId: event.actorId,
              actorName: event.actorName,
              previousStatus: event.previousStatus,
              previousStage: event.previousStage,
              nextStatus: event.nextStatus,
              nextStage: event.nextStage,
            };

      await this.dispatchService.dispatch({
        recipientUserId,
        preferenceKey: 'statusChange',
        notificationType,
        payload,
      });
    }
  }

  @OnEvent(NOTIFICATION_EVENTS.IDEA_STATUS_CHANGED, { async: true })
  async handleIdeaStatusChanged(
    event: IdeaStatusChangedNotificationEvent,
  ): Promise<void> {
    await this.dispatchService.dispatch({
      recipientUserId: event.recipientUserId,
      preferenceKey: 'statusChange',
      notificationType: NOTIFICATION_EVENTS.IDEA_STATUS_CHANGED,
      payload: {
        ideaId: event.ideaId,
        ideaTitle: event.ideaTitle,
        actorId: event.actorId,
        actorName: event.actorName,
        previousStatus: event.previousStatus,
        previousStage: event.previousStage,
        nextStatus: event.nextStatus,
        nextStage: event.nextStage,
      },
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.PROBLEM_STATUS_CHANGED, { async: true })
  async handleProblemStatusChanged(
    event: ProblemStatusChangedNotificationEvent,
  ): Promise<void> {
    await this.dispatchService.dispatch({
      recipientUserId: event.recipientUserId,
      preferenceKey: 'statusChange',
      notificationType: NOTIFICATION_EVENTS.PROBLEM_STATUS_CHANGED,
      payload: {
        problemId: event.problemId,
        problemTitle: event.problemTitle,
        actorId: event.actorId,
        actorName: event.actorName,
        previousStatus: event.previousStatus,
        previousStage: event.previousStage,
        nextStatus: event.nextStatus,
        nextStage: event.nextStage,
      },
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.IDEA_SUPPORTER_ADDED, { async: true })
  async handleIdeaSupporterAdded(
    event: SupporterAddedNotificationEvent,
  ): Promise<void> {
    await this.dispatchService.dispatch({
      recipientUserId: event.recipientUserId,
      preferenceKey: 'newSupporters',
      notificationType: NOTIFICATION_EVENTS.IDEA_SUPPORTER_ADDED,
      payload: {
        entityType: event.entityType,
        entityId: event.entityId,
        entityTitle: event.entityTitle,
        actorId: event.actorId,
        actorName: event.actorName,
      },
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.PROBLEM_SUPPORTER_ADDED, { async: true })
  async handleProblemSupporterAdded(
    event: SupporterAddedNotificationEvent,
  ): Promise<void> {
    await this.dispatchService.dispatch({
      recipientUserId: event.recipientUserId,
      preferenceKey: 'newSupporters',
      notificationType: NOTIFICATION_EVENTS.PROBLEM_SUPPORTER_ADDED,
      payload: {
        entityType: event.entityType,
        entityId: event.entityId,
        entityTitle: event.entityTitle,
        actorId: event.actorId,
        actorName: event.actorName,
      },
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.SIMILAR_FOUND, { async: true })
  async handleSimilarFound(
    event: SimilarFoundNotificationEvent,
  ): Promise<void> {
    const notificationType =
      event.entityType === 'idea'
        ? NOTIFICATION_EVENTS.SIMILAR_IDEA_DETECTED
        : NOTIFICATION_EVENTS.SIMILAR_PROBLEM_DETECTED;
    const preferenceKey =
      event.entityType === 'idea' ? 'newSimilarIdeas' : 'newSimilarProblems';

    for (const match of event.matches) {
      await this.dispatchService.dispatch({
        recipientUserId: match.recipientUserId,
        preferenceKey,
        notificationType,
        payload: {
          entityType: event.entityType,
          sourceEntityId: match.matchedEntityId,
          sourceEntityTitle: match.matchedEntityTitle,
          matchedEntityId: event.sourceEntityId,
          matchedEntityTitle: event.sourceEntityTitle,
        },
      });
    }
  }

  @OnEvent(NOTIFICATION_EVENTS.SIMILAR_IDEA_DETECTED, { async: true })
  async handleSimilarIdeaDetected(
    event: SimilarItemDetectedNotificationEvent,
  ): Promise<void> {
    await this.dispatchService.dispatch({
      recipientUserId: event.recipientUserId,
      preferenceKey: 'newSimilarIdeas',
      notificationType: NOTIFICATION_EVENTS.SIMILAR_IDEA_DETECTED,
      payload: {
        entityType: event.entityType,
        sourceEntityId: event.sourceEntityId,
        sourceEntityTitle: event.sourceEntityTitle,
        matchedEntityId: event.matchedEntityId,
        matchedEntityTitle: event.matchedEntityTitle,
      },
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.SIMILAR_PROBLEM_DETECTED, { async: true })
  async handleSimilarProblemDetected(
    event: SimilarItemDetectedNotificationEvent,
  ): Promise<void> {
    await this.dispatchService.dispatch({
      recipientUserId: event.recipientUserId,
      preferenceKey: 'newSimilarProblems',
      notificationType: NOTIFICATION_EVENTS.SIMILAR_PROBLEM_DETECTED,
      payload: {
        entityType: event.entityType,
        sourceEntityId: event.sourceEntityId,
        sourceEntityTitle: event.sourceEntityTitle,
        matchedEntityId: event.matchedEntityId,
        matchedEntityTitle: event.matchedEntityTitle,
      },
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.FOLLOWUP_REQUIRED, { async: true })
  async handleFollowUpRequired(
    event: FollowUpRequiredNotificationEvent,
  ): Promise<void> {
    await this.dispatchService.dispatch({
      recipientUserId: event.recipientUserId,
      preferenceKey: 'followUps',
      notificationType: NOTIFICATION_EVENTS.FOLLOWUP_REQUIRED,
      payload: {
        entityType: event.entityType,
        entityId: event.entityId,
        entityTitle: event.entityTitle,
        draftUpdatedAt: event.draftUpdatedAt,
      },
    });
  }
}
