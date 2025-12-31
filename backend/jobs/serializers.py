from rest_framework import serializers
from .models import JobApplication, StageHistory



class JobApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobApplication
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at", "user"]


class StageChangeSerializer(serializers.Serializer):
    stage = serializers.ChoiceField(
        choices=JobApplication.STAGE_CHOICES
    )

    def save(self, **kwargs):
        job = self.context["job"]
        new_stage = self.validated_data["stage"]

        if job.stage != new_stage:
            StageHistory.objects.create(
                job=job,
                from_stage=job.stage,
                to_stage=new_stage
            )
            job.stage = new_stage
            job.save(update_fields=["stage"])

        return job



class VerdictSerializer(serializers.Serializer):
    verdict = serializers.ChoiceField(
        choices=JobApplication.VERDICT_CHOICES
    )

    def validate(self, data):
        job = self.context["job"]
        if job.stage != "OFFER":
            raise serializers.ValidationError(
                "Verdict allowed only when stage is OFFER."
            )
        return data

    def save(self, **kwargs):
        job = self.context["job"]
        job.verdict = self.validated_data["verdict"]
        job.save(update_fields=["verdict"])
        return job
